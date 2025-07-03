import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ShowTimesService } from './show-times.service';
import { CreateShowTimeDto } from './dto/create-show-time.dto';
import { UpdateShowTimeDto } from './dto/update-show-time.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth/jwt-auth.guard';
import { FindAllDto } from '../global/find-all.dto';
import { ResponseData } from '../global/globalClass';
import { HttpMessage } from '../global/globalEnum';

@Controller('show-times')
export class ShowTimesController {
  constructor(private readonly showTimesService: ShowTimesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createShowTimeDto: CreateShowTimeDto) {
    console.log('Received DTO:', createShowTimeDto); // Debug log
    const showtime = await this.showTimesService.create(createShowTimeDto);
    return new ResponseData(showtime, HttpStatus.CREATED, HttpMessage.CREATED);
  }

  @Get()
  async findAll(@Query() query: FindAllDto) {
    const showtimes = await this.showTimesService.findAll(query);
    return new ResponseData(showtimes, HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: string) {
    const showtime = await this.showTimesService.findOne(+id);
    return new ResponseData(showtime, HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateShowTimeDto: UpdateShowTimeDto,
  ) {
    const showtime = await this.showTimesService.update(+id, updateShowTimeDto);
    return new ResponseData(showtime, HttpStatus.OK, HttpMessage.UPDATED);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: string) {
    const showtime = await this.showTimesService.remove(+id);
    return new ResponseData(showtime, HttpStatus.OK, HttpMessage.DELETED);
  }
}
