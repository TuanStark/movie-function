import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingInput, UpdateBookingInput } from './dto/booking.interface';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService){}
  
  async createBooking(input: CreateBookingInput) {  
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
  
    // 5. Tính tổng tiền
    const totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0);
  
    // 6. Tạo mã đặt chỗ
    const bookingCode = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
    // 7. Tạo booking và bookingSeat trong transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId: input.userId,
          showtimeId: input.showtimeId,
          totalPrice,
          bookingDate: new Date(),
          bookingCode,
          status: 'CONFIRMED',
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
  
    // 8. Trả về kết quả
    return {
      ...booking,
      seats,
      showtime,
    };
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
          seats: true,
          showtime: true,
          user: true
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
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  async updateBooking(bookingId: number, input: UpdateBookingInput) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: input.status,
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
}
