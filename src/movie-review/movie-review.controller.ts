import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MovieReviewService } from './movie-review.service';
import { CreateMovieReviewDto } from './dto/create-movie-review.dto';
import { UpdateMovieReviewDto } from './dto/update-movie-review.dto';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage, HttpStatus } from 'src/global/globalEnum';
import { JwtAuthGuard } from 'src/auth/guard';
import { FindAllDto } from 'src/global/find-all.dto';

@Controller('movie-review')
export class MovieReviewController {
  constructor(private readonly movieReviewService: MovieReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createMovieReviewDto: CreateMovieReviewDto) {
    try {
      return new ResponseData(
        await this.movieReviewService.create(createMovieReviewDto),
        HttpStatus.CREATED,
        HttpMessage.CREATED
      );
    } catch (error) {
      return new ResponseData(
        null,
        HttpStatus.BAD_REQUEST,
        error.message || HttpMessage.INVALID_INPUT_FORMAT
      );
    }
  }

  @Get('movie/:movieId')
  async getReviewsByMovie(
    @Param('movieId') movieId: number,
    @Query() query: FindAllDto,
  ) {
    try {
      return new ResponseData(
        await this.movieReviewService.getReviewsByMovie(movieId, query),
        HttpStatus.ACCEPTED,
        HttpMessage.SUCCESS
      );
    } catch (error) {
      return new ResponseData(
        null,
        HttpStatus.BAD_REQUEST,
        error.message || HttpMessage.INVALID_INPUT_FORMAT
      );
    }
  }

  @Get(':userId/:movieId')
  async getReview(
    @Param('userId', ) userId: number,
    @Param('movieId',) movieId: number,
  ) {
    try {
      return new ResponseData(
        await this.movieReviewService.getReview(userId, movieId),
        HttpStatus.ACCEPTED,
        HttpMessage.SUCCESS
      );
    } catch (error) {
      return new ResponseData(
        null,
        HttpStatus.BAD_REQUEST,
        error.message || HttpMessage.INVALID_INPUT_FORMAT
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @Patch(':userId/:movieId')
  // async updateReview(
  //   @Param('userId') userId: number,
  //   @Param('movieId') movieId: number,
  //   @Body() updateReviewDto: UpdateMovieReviewDto,
  // ) {
  //   try {
  //     return new ResponseData(
  //       await this.movieReviewService.update(userId, movieId, updateReviewDto),
  //       HttpStatus.ACCEPTED,
  //       HttpMessage.SUCCESS
  //     );
  //   } catch (error) {
  //     return new ResponseData(
  //       null,
  //       HttpStatus.BAD_REQUEST,
  //       error.message || HttpMessage.INVALID_INPUT_FORMAT
  //     );
  //   }
  // }

  @Delete(':userId/:movieId')
  async deleteReview(
    @Param('userId') userId: number,
    @Param('movieId') movieId: number,
  ) {
    try {
      return new ResponseData(
        await this.movieReviewService.delete(userId, movieId),
        HttpStatus.ACCEPTED,
        HttpMessage.SUCCESS
      );
    } catch (error) {
      return new ResponseData(
        null,
        HttpStatus.BAD_REQUEST,
        error.message || HttpMessage.INVALID_INPUT_FORMAT
      );
    }
  }
}
