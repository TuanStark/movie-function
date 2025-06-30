import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MovieCastsService } from './movie-casts.service';
import { CreateMovieCastDto } from './dto/create-movie-cast.dto';
import { UpdateMovieCastDto } from './dto/update-movie-cast.dto';

@Controller('movie-casts')
export class MovieCastsController {
  constructor(private readonly movieCastsService: MovieCastsService) {}

  @Post()
  create(@Body() createMovieCastDto: CreateMovieCastDto) {
    return this.movieCastsService.create(createMovieCastDto);
  }

  @Get()
  findAll() {
    return this.movieCastsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movieCastsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieCastDto: UpdateMovieCastDto) {
    return this.movieCastsService.update(+id, updateMovieCastDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movieCastsService.remove(+id);
  }
}
