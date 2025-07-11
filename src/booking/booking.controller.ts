import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, UseGuards, Query, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from '../global/globalEnum';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';
import { FindAllDto } from 'src/global/find-all.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 3000000 }, // 2MB limit
    fileFilter: (_req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log("Received booking data:", createBookingDto);
    console.log("Received file:", file ? file.originalname : 'No file');
    try {
      const booking = await this.bookingService.createBooking(createBookingDto, file);
      return new ResponseData(booking, HttpStatus.CREATED, HttpMessage.CREATED)
    } catch (error) {
      console.error("Booking creation error:", error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Post('momo')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 3000000 }, // 3MB limit
    fileFilter: (_req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async createBookingWithMoMo(
    @Body() createBookingDto: CreateBookingDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log("Received MoMo booking data:", createBookingDto);
    try {
      const result = await this.bookingService.createBookingWithMoMoPayment(createBookingDto, file);
      return new ResponseData(result, HttpStatus.CREATED, HttpMessage.CREATED)
    } catch (error) {
      console.error("MoMo booking creation error:", error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Post('vnpay')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 3000000 }, // 3MB limit
    fileFilter: (_req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async createBookingWithVNPay(
    @Body() createBookingDto: CreateBookingDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    console.log("Received VNPay booking data:", createBookingDto);
    try {
      let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';

      // Convert IPv6 localhost to IPv4
      if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
        ipAddr = '127.0.0.1';
      }

      // Extract first IP if multiple IPs
      if (typeof ipAddr === 'string' && ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0].trim();
      }

      const result = await this.bookingService.createBookingWithVNPayPayment(createBookingDto, ipAddr, file);
      return new ResponseData(result, HttpStatus.CREATED, HttpMessage.CREATED)
    } catch (error) {
      console.error("VNPay booking creation error:", error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: FindAllDto) {
    try {
      const booking = await this.bookingService.findAll(query);
      return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const booking = await this.bookingService.getBooking(+id);
      return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findByUser(@Param('id') id: string) {
    try {
      const booking = await this.bookingService.getUserBookings(+id);
      return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 2000000 }, // 2MB limit
    fileFilter: (_req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const booking = await this.bookingService.updateBooking(+id, updateBookingDto, file);
        return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SUCCESS)
    } catch (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancel(@Param('id') id: number) {
    try {
      const booking = await this.bookingService.cancelBooking(id);
        return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('showtime/:showtimeId/seats')
  async getAvailableSeats(@Param('showtimeId') showtimeId: number) {
    try {
      const booking = await this.bookingService.getAvailableSeats(showtimeId);
        return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
