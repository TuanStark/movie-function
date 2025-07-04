import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, UseGuards, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from '../global/globalEnum';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';
import { FindAllDto } from 'src/global/find-all.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    try {
      const booking = await this.bookingService.createBooking(createBookingDto);
      return new ResponseData(booking, HttpStatus.CREATED, HttpMessage.CREATED)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: FindAllDto) {
    try {
      const booking = await this.bookingService.findAll(query);
      return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const booking = await this.bookingService.getBooking(+id);
      return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findByUser(@Param('id') id: string) {
    try {
      const booking = await this.bookingService.getUserBookings(+id);
      return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    try {
      const booking = await this.bookingService.updateBooking(+id, updateBookingDto);
        return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async cancel(@Param('id') id: number) {
    try {
      const booking = await this.bookingService.cancelBooking(id);
        return new ResponseData(booking, HttpStatus.ACCEPTED, HttpMessage.SERVER_ERROR)
    } catch (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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
