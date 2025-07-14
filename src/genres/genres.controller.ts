import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, UseGuards, Query } from '@nestjs/common';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from 'src/global/globalEnum';
import { FindAllDto } from 'src/global/find-all.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorator/role.decorator';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() createGenreDto: CreateGenreDto) {
    try {
      const genres = await this.genresService.create(createGenreDto);
      return new ResponseData(genres, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query() query: FindAllDto) {
    try {
      const genres = await this.genresService.findAll(query);
      return new ResponseData(genres, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

 
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const genres = await this.genresService.findOne(+id);
      return new ResponseData(genres, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateGenreDto: UpdateGenreDto) {
    try {
      const genres = await this.genresService.update(+id, updateGenreDto);
      return new ResponseData(genres, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.genresService.remove(+id);
  }
}
