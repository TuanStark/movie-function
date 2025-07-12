import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingInput, UpdateBookingInput } from './dto/booking.interface';
import { FindAllDto } from 'src/global/find-all.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PaymentService } from 'src/payment/payment.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly paymentService: PaymentService,
    private readonly mailerService: MailerService,
  ){}
  
  async createBooking(input: CreateBookingInput, file?: Express.Multer.File) {
    // 1. Kiểm tra suất chiếu
    const showtime = await this.prisma.showtime.findUnique({
      where: { id: input.showtimeId },
      include: { movie: true, theater: true },
    });

    if (!showtime) {
      throw new NotFoundException('Showtime not found');
    }
  
    // 2. Lấy danh sách ghế hợp lệ từ DB (dựa trên seatIds và theaterId)
    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: input.seatIds },
        theaterId: showtime.theaterId,
      },
    });
  
    // 3. Kiểm tra những ghế không hợp lệ
    const seatIdsFound = seats.map(seat => seat.id);
    const invalidSeatIds = input.seatIds.filter(id => !seatIdsFound.includes(id));
  
    if (invalidSeatIds.length > 0) {
      throw new BadRequestException(
        `Invalid or unavailable seat IDs: ${invalidSeatIds.join(', ')}`
      );
    }
  
    // 4. Kiểm tra ghế đã được đặt chưa
    const existingBookingSeats = await this.prisma.bookingSeat.findMany({
      where: {
        seatId: { in: input.seatIds },
        booking: { showtimeId: input.showtimeId },
      },
    });
  
    if (existingBookingSeats.length > 0) {
      const alreadyBookedIds = existingBookingSeats.map(seat => seat.seatId);
      throw new ConflictException(`Seats already booked: ${alreadyBookedIds.join(', ')}`);
    }
  
    // 5. Lấy thông tin user để kiểm tra role
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 6. Tính tổng tiền cơ bản
    let totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0);

    // 7. Áp dụng giảm giá cho sinh viên
    const originalPrice = totalPrice;
    if (user.role === "student") {
      totalPrice *= 0.8; // Giảm 20% cho sinh viên
      console.log(`Student discount applied: ${originalPrice} -> ${totalPrice}`);
    }

    // 8. Kiểm tra giờ cao điểm và áp dụng phụ thu
    const showtimeDate = new Date(showtime.date);
    const showtimeTime = showtime.time;
    const isPeakHour = showtimeDate.getDay() >= 5 || showtimeTime > "18:00"; // Cuối tuần hoặc buổi tối

    if (isPeakHour) {
      const priceBeforeSurcharge = totalPrice;
      totalPrice += 20000; // Phụ thu giờ cao điểm 20,000 VND
      console.log(`Peak hour surcharge applied: ${priceBeforeSurcharge} -> ${totalPrice}`);
    }

    console.log(`Final total price: ${totalPrice}`);
  
    // 9. Xử lý upload image nếu có
    let imagePath = input.images || 'images.png'; // default value
    if (file) {
      try {
        const result = await this.cloudinaryService.uploadImage(file, {
          folder: 'bookings',
        });
        imagePath = result.secure_url;
      } catch (error) {
        console.error('Error uploading image:', error);
        // Không throw error, chỉ sử dụng default image
      }
    }

    // 10. Tạo mã đặt chỗ
    const bookingCode = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 11. Tạo booking và bookingSeat trong transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId: input.userId,
          showtimeId: input.showtimeId,
          promotionId: input.promotionId,
          totalPrice: totalPrice + showtime.price,
          bookingDate: new Date(),
          bookingCode,
          status: 'PENDING',
          fisrtName: input.firstName || '',
          lastName: input.lastName || '',
          email: input.email || '',
          phoneNumber: input.phoneNumber || '',
          paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
          images: imagePath,
        },
      });
  
      await tx.bookingSeat.createMany({
        data: input.seatIds.map(seatId => ({
          bookingId: newBooking.id,
          seatId,
          status: 'BOOKED',
        })),
      });
  
      return newBooking;
    });
  
    // 12. Trả về kết quả
    return {
      ...booking,
      seats,
      showtime,
    };
  }

  async createBookingWithMoMoPayment(input: CreateBookingInput, file?: Express.Multer.File) {
    // Tạo booking với status PENDING
    const booking = await this.createBooking(input, file);

    // Tạo MoMo payment request
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    const momoPaymentData = {
      orderId: booking.bookingCode,
      amount: Math.round(booking.totalPrice), // MoMo requires integer
      orderInfo: `Thanh toán vé xem phim - ${booking.bookingCode}`,
      redirectUrl: `${baseUrl}/payment/momo/return`,
      ipnUrl: `${baseUrl}/payment/momo/callback`,
      extraData: booking.id.toString(), // Pass booking ID for callback
    };

    try {
      const paymentResponse = await this.paymentService.createMoMoPayment(momoPaymentData);

      // Tạo payment record trong database
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          orderId: booking.bookingCode,
          amount: Math.round(booking.totalPrice),
          paymentMethod: 'MOMO',
          status: 'PENDING',
          requestId: paymentResponse.requestId,
        },
      });

      return {
        booking,
        payment: {
          id: payment.id,
          payUrl: paymentResponse.payUrl,
          qrCodeUrl: paymentResponse.qrCodeUrl,
          deeplink: paymentResponse.deeplink,
        },
      };
    } catch (error) {
      // If payment creation fails, cancel the booking
      await this.cancelBooking(booking.id);
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
    }
  }

  async createBookingWithVNPayPayment(input: CreateBookingInput, ipAddr: string, file?: Express.Multer.File) {
    // Tạo booking với status PENDING
    const booking = await this.createBooking(input, file);

    // Tạo VNPay payment request
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    const vnpayPaymentData = {
      orderId: booking.bookingCode,
      amount: Math.round(booking.totalPrice), // VNPay requires integer
      orderInfo: `PaymentForMovieTicket-${booking.bookingCode}`, // Use English to avoid encoding issues
      returnUrl: `${baseUrl}/payment/vnpay/return`,
      ipAddr: ipAddr,
      locale: 'vn',
    };

    try {
      const paymentResponse = await this.paymentService.createVNPayPayment(vnpayPaymentData);

      // Tạo payment record trong database
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          orderId: booking.bookingCode,
          amount: Math.round(booking.totalPrice),
          paymentMethod: 'VNPAY',
          status: 'PENDING',
        },
      });

      return {
        booking,
        payment: {
          id: payment.id,
          vnpUrl: paymentResponse.vnpUrl,
        },
      };
    } catch (error) {
      // If payment creation fails, cancel the booking
      await this.cancelBooking(booking.id);
      throw new BadRequestException(`Failed to create VNPay payment: ${error.message}`);
    }
  }
  
  async findAll(query: FindAllDto) {
    const { 
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if(pageNumber < 1 || limitNumber < 1) {
      throw new Error('Page and limit must be greater than 0');
    }

    const take = limitNumber;
    const skip = (pageNumber - 1) * take;

    const searchUpCase = search.charAt(0).toUpperCase() + search.slice(1);
    const where = search
      ? {
        OR: [
          { title: { contains: searchUpCase } },
          { synopsis: { contains: searchUpCase } },
        ]
      }
      : {};
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        // where: where,
        orderBy: orderBy,
        skip,
        take,
        include: {
          seats: {
            include: {
              seat: true,
            },
          },
          showtime: {
            include: {
              movie: true,
              theater: true,
            },
          },
          user: true,
          payments: {
            orderBy: { createdAt: 'desc' }
          },
        }
      }),
      this.prisma.movie.count({
        where: where,
      })
    ])

    return {
      data: bookings,
      meta: {
        total,
        pageNumber,
        limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async getBooking(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        showtime: {
          include: {
            movie: true,
            theater: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getUserBookings(userId: number) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        showtime: {
          include: {
            movie: true,
            theater: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  async updateBooking(bookingId: number, input: UpdateBookingInput, file?: Express.Multer.File) {
    // Xử lý upload image nếu có
    let imagePath = input.images;
    if (file) {
      try {
        const result = await this.cloudinaryService.uploadImage(file, {
          folder: 'bookings',
        });
        imagePath = result.secure_url;
      } catch (error) {
        console.error('Error uploading image:', error);
        // Không throw error, giữ nguyên image cũ
      }
    }

    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: input.status,
        paymentMethod: input.paymentMethod,
        images: imagePath,
        updatedAt: new Date(),
      },
      include: {
        seats: true,
        showtime: true,
        user: true
      },
    });
    return booking;
  }

  async cancelBooking(bookingId: number) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      await tx.bookingSeat.updateMany({
        where: { bookingId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      return booking;
    });
  }

  async getAvailableSeats(showtimeId: number) {
    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: { theater: true },
    });

    if (!showtime) {
      throw new NotFoundException('Showtime not found');
    }

    const bookedSeats = await this.prisma.bookingSeat.findMany({
      where: {
        booking: { showtimeId },
        status: 'BOOKED',
      },
      select: { seatId: true },
    });

    const bookedSeatIds = bookedSeats.map((bs) => bs.seatId);

    const availableSeats = await this.prisma.seat.findMany({
      where: {
        theaterId: showtime.theaterId,
        NOT: {
          id: { in: bookedSeatIds },
        },
      },
    });

    return availableSeats;
  }


  async buildConfirmationUrl(orderId: string, status: 'confirmed' | 'failed'): Promise<string> {
    try {
      // Find booking by orderId
      const booking = await this.prisma.booking.findFirst({
        where: { bookingCode: orderId },
        include: {
          user: true,
          seats: {
            include: {
              seat: true,
            },
          },
        },
      });

      if (!booking) {
        return `http://localhost:3000/confirmation/error?message=Booking not found`;
      }

      // Get showtime details separately
      const showtime = await this.prisma.showtime.findUnique({
        where: { id: booking.showtimeId },
        include: {
          movie: true,
          theater: true,
        },
      });

      if (!showtime) {
        return `http://localhost:3000/confirmation/error?message=Showtime not found`;
      }

      // Build simple confirmation URL matching the interface
      const baseUrl = 'http://localhost:3000/confirmation';
      const params = new URLSearchParams({
        title: showtime.movie.title,
        time: showtime.time,
        price: showtime.price.toString(),
        date: showtime.date.toISOString().split('T')[0],
        paymentMethod: 'VNPAY',
        bookingDate: booking.createdAt.toISOString().split('T')[0],
        status: status,
        totalPrice: booking.totalPrice.toString(),
        firstName: booking.user.firstName || '',
        lastName: booking.user.lastName || '',
        email: booking.user.email || '',
      });

      this.mailerService.sendMail({
        to: booking.user.email,
        subject: 'Xác nhận thanh toán vé xem phim',
        template: 'ticket',
        context: {
          title: showtime.movie.title,
          time: showtime.time,
          price: showtime.price,
          date: showtime.date.toISOString().split('T')[0],
          paymentMethod: 'VNPAY',
          bookingDate: booking.createdAt.toISOString().split('T')[0],
          status: status,
          totalPrice: booking.totalPrice,
          firstName: booking.user.firstName || '',
          lastName: booking.user.lastName || '',
          email: booking.user.email || '',
          bookingCode: booking.bookingCode,
          theater: showtime.theater.name,
          seats: booking.seats.map((seat: any) => ({
            row: seat.seat.row,
            number: seat.seat.number
          })),
        },
      });

      return `${baseUrl}/${orderId}?${params.toString()}`;
    } catch (error) {
      console.error('Error building confirmation URL:', error);
      return `http://localhost:3000/confirmation/error?message=Error building confirmation URL`;
    }
  }

  async updateVNPayPaymentStatus(vnpParams: any, status: string) {
    try {
      const orderId = vnpParams.vnp_TxnRef;
      const amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert from VND cents

      // Find payment record
      const payment = await this.prisma.payment.findFirst({
        where: { orderId: orderId },
        include: { booking: true }
      });

      if (!payment) {
        console.error(`Payment not found for orderId: ${orderId}`);
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        // Update payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: status,
            transId: vnpParams.vnp_TransactionNo || null,
            resultCode: parseInt(vnpParams.vnp_ResponseCode),
            message: status === 'SUCCESS' ? 'Payment successful' : 'Payment failed',
            updatedAt: new Date(),
          },
        });

        // Update booking status
        const bookingStatus = status === 'SUCCESS' ? 'CONFIRMED' : 'CANCELLED';
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: bookingStatus,
            paymentMethod: 'VNPAY',
            updatedAt: new Date(),
          },
        });
      });

      console.log(`VNPay payment ${status} for booking ${payment.bookingId}`);
    } catch (error) {
      console.error('Error updating VNPay payment status:', error);
    }
  }
}
