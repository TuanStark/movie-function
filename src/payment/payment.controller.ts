import { Controller, Post, Body, HttpStatus, HttpException, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, CreateVNPayPaymentDto, MoMoCallbackDto, VNPayCallbackDto } from './dto/create-payment.dto';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from 'src/global/globalEnum';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('momo/create')
  async createMoMoPayment(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      const paymentResponse = await this.paymentService.createMoMoPayment(createPaymentDto);
      return new ResponseData(paymentResponse, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('vnpay/create')
  async createVNPayPayment(@Body() createVNPayPaymentDto: CreateVNPayPaymentDto) {
    try {
      const paymentResponse = await this.paymentService.createVNPayPayment(createVNPayPaymentDto);
      return new ResponseData(paymentResponse, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('vnpay/verify')
  async verifyVNPaySignature(@Body() vnpParams: any) {
    try {
      const isValid = this.paymentService.verifyVNPaySignature(vnpParams);
      return new ResponseData({ isValid, params: vnpParams }, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('vnpay/test')
  async testVNPaySignature(@Query() query: any) {
    try {
      console.log('VNPay Test Query:', query);

      // Test signature verification
      const isValid = this.paymentService.verifyVNPaySignature(query);

      return new ResponseData({
        isValid,
        receivedParams: query,
        message: isValid ? 'Signature is valid' : 'Signature is invalid'
      }, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('vnpay/config')
  async getVNPayConfig() {
    try {
      // Return VNPay configuration (without sensitive data)
      return new ResponseData({
        vnpUrl: process.env.VNPAY_URL,
        vnpTmnCode: process.env.VNPAY_TMN_CODE,
        hasHashSecret: !!process.env.VNPAY_HASH_SECRET,
        hashSecretLength: process.env.VNPAY_HASH_SECRET?.length || 0,
        environment: process.env.NODE_ENV || 'development'
      }, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('booking/:bookingId')
  async getPaymentsByBooking(@Param('bookingId') bookingId: string) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { bookingId: parseInt(bookingId) },
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingCode: true,
              totalPrice: true,
              status: true
            }
          }
        }
      });
      return new ResponseData(payments, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':paymentId')
  async getPaymentDetails(@Param('paymentId') paymentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: parseInt(paymentId) },
        include: {
          booking: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              },
              showtime: {
                include: {
                  movie: { select: { id: true, title: true } },
                  theater: { select: { id: true, name: true } }
                }
              }
            }
          }
        }
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      return new ResponseData(payment, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('momo/callback')
  async handleMoMoCallback(@Body() callbackData: MoMoCallbackDto) {
    try {
      console.log('MoMo Callback received:', callbackData);

      // Verify signature
      const isValidSignature = this.paymentService.verifyMoMoSignature(callbackData);

      if (!isValidSignature) {
        console.error('Invalid MoMo signature');
        return { resultCode: 1, message: 'Invalid signature' };
      }

      // Extract booking ID from extraData
      const bookingId = callbackData.extraData ? parseInt(callbackData.extraData) : null;

      // Tìm payment record dựa trên orderId
      const whereClause: any = { orderId: callbackData.orderId };
      if (bookingId) {
        whereClause.bookingId = bookingId;
      }

      const payment = await this.prisma.payment.findFirst({
        where: whereClause,
        include: { booking: true }
      });

      if (!payment) {
        console.error(`Payment not found for orderId: ${callbackData.orderId}`);
        return { resultCode: 1, message: 'Payment not found' };
      }

      if (callbackData.resultCode === 0) {
        // Payment successful
        await this.prisma.$transaction(async (tx) => {
          // Cập nhật payment record
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              transId: callbackData.transId,
              resultCode: callbackData.resultCode,
              message: callbackData.message,
              signature: callbackData.signature,
              updatedAt: new Date(),
            },
          });

          // Cập nhật booking status
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: {
              status: 'CONFIRMED',
              paymentMethod: 'MOMO',
              updatedAt: new Date(),
            },
          });
        });

        console.log(`Payment successful for booking ${payment.bookingId}`);
        return { resultCode: 0, message: 'Payment confirmed' };
      } else {
        // Payment failed
        await this.prisma.$transaction(async (tx) => {
          // Cập nhật payment record
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              resultCode: callbackData.resultCode,
              message: callbackData.message,
              signature: callbackData.signature,
              updatedAt: new Date(),
            },
          });

          // Cập nhật booking status
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: {
              status: 'CANCELLED',
              updatedAt: new Date(),
            },
          });
        });

        console.log(`Payment failed for booking ${payment.bookingId}: ${callbackData.message}`);
        return { resultCode: 1, message: 'Payment failed' };
      }
    } catch (error) {
      console.error('MoMo callback error:', error);
      return { resultCode: 1, message: 'Internal server error' };
    }
  }

  @Get('momo/return')
  async handleMoMoReturn(@Query() query: any) {
    try {
      console.log('MoMo Return URL accessed:', query);

      const { resultCode, orderId, message } = query;

      if (resultCode === '0') {
        return `
          <html>
            <body>
              <h2>Thanh toán MoMo thành công!</h2>
              <p>Mã đơn hàng: ${orderId}</p>
              <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
          </html>
        `;
      } else {
        return `
          <html>
            <body>
              <h2>Thanh toán MoMo thất bại!</h2>
              <p>Mã đơn hàng: ${orderId}</p>
              <p>Lý do: ${message}</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
          </html>
        `;
      }
    } catch (error) {
      console.error('MoMo return error:', error);
      return '<h2>Có lỗi xảy ra!</h2>';
    }
  }

  @Get('vnpay/return')
  async handleVNPayReturn(@Query() query: any) {
    try {
      console.log('VNPay Return URL accessed:', query);

      // Verify signature
      const isValidSignature = this.paymentService.verifyVNPaySignature(query);

      if (!isValidSignature) {
        return `
          <html>
            <body>
              <h2>Lỗi xác thực!</h2>
              <p>Chữ ký không hợp lệ.</p>
            </body>
          </html>
        `;
      }

      const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionStatus } = query;

      if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
        // Update payment status in database
        await this.updateVNPayPaymentStatus(query, 'SUCCESS');

        return `
          <html>
            <body>
              <h2>Thanh toán VNPay thành công!</h2>
              <p>Mã đơn hàng: ${vnp_TxnRef}</p>
              <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
          </html>
        `;
      } else {
        // Update payment status in database
        await this.updateVNPayPaymentStatus(query, 'FAILED');

        return `
          <html>
            <body>
              <h2>Thanh toán VNPay thất bại!</h2>
              <p>Mã đơn hàng: ${vnp_TxnRef}</p>
              <p>Mã lỗi: ${vnp_ResponseCode}</p>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
          </html>
        `;
      }
    } catch (error) {
      console.error('VNPay return error:', error);
      return '<h2>Có lỗi xảy ra!</h2>';
    }
  }

  private async updateVNPayPaymentStatus(vnpParams: any, status: string) {
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
