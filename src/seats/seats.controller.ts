import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UsePipes, ValidationPipe, UseGuards, HttpException } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { BulkCreateSeatDto } from './dto/bulk-create-seat.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage, HttpStatus } from 'src/global/globalEnum';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.createSeat(createSeatDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  @UsePipes(new ValidationPipe())
  async bulkCreate(@Body() bulkCreateSeatDto: BulkCreateSeatDto) {
    return this.seatsService.bulkCreateSeats(bulkCreateSeatDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.seatsService.getSeat(id);
  }

  @Get('theater/:theaterId')
  async findByTheater(@Param('theaterId', ParseIntPipe) theaterId: number) {
    try {
      const seats = await this.seatsService.getSeatsByTheater(theaterId);
      return new ResponseData(seats, HttpStatus.ACCEPTED, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UsePipes(new ValidationPipe())
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateSeatDto: UpdateSeatDto) {
    return this.seatsService.updateSeat(id, updateSeatDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.seatsService.deleteSeat(id);
  } 
}
