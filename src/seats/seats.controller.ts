import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { BulkCreateSeatDto } from './dto/bulk-create-seat.dto';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.createSeat(createSeatDto);
  }

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
    return this.seatsService.getSeatsByTheater(theaterId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateSeatDto: UpdateSeatDto) {
    return this.seatsService.updateSeat(id, updateSeatDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.seatsService.deleteSeat(id);
  } 
}
