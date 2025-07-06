import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MovieCastsService } from './movie-casts.service';
import { CreateMovieCastDto } from './dto/create-movie-cast.dto';
import { UpdateMovieCastDto } from './dto/update-movie-cast.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

@Controller('movie-casts')
export class MovieCastsController {
  constructor(private readonly movieCastsService: MovieCastsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMovieCastDto: CreateMovieCastDto) {
    return this.movieCastsService.create(createMovieCastDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.movieCastsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movieCastsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieCastDto: UpdateMovieCastDto) {
    return this.movieCastsService.update(+id, updateMovieCastDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movieCastsService.remove(+id);
  }
}
