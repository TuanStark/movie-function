import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ShowTimesService } from './show-times.service';
import { CreateShowTimeDto } from './dto/create-show-time.dto';
import { UpdateShowTimeDto } from './dto/update-show-time.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth/jwt-auth.guard';
import { FindAllDto } from '../global/find-all.dto';
import { ResponseData } from '../global/globalClass';
import { HttpMessage } from '../global/globalEnum';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/role.decorator';

@Controller('show-times')
export class ShowTimesController {
  constructor(private readonly showTimesService: ShowTimesService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() createShowTimeDto: CreateShowTimeDto) {
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
    try {
      const showtime = await this.showTimesService.findOne(+id);
      return new ResponseData(showtime, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('movie/:movieId')
  async getShowtimesByMovieId(@Param('movieId', ParseIntPipe) movieId: string) {
    const showtimes = await this.showTimesService.getShowtimesByMovieId(+movieId);
    return new ResponseData(showtimes, HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateShowTimeDto: UpdateShowTimeDto,
  ) {
    const showtime = await this.showTimesService.update(+id, updateShowTimeDto);
    return new ResponseData(showtime, HttpStatus.OK, HttpMessage.UPDATED);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: string) {
    const showtime = await this.showTimesService.remove(+id);
    return new ResponseData(showtime, HttpStatus.OK, HttpMessage.DELETED);
  }
}
