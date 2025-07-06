import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { MovieGenresService } from './movie-genres.service';
import { CreateMovieGenreDto } from './dto/create-movie-genre.dto';
import { UpdateMovieGenreDto } from './dto/update-movie-genre.dto';
import { MovieGenreResponseDto } from './dto/movie-genres-response.dto';
import { AddGenresToMovieDto } from './dto/add-genres-movie.dto';
import { FindAllDto } from 'src/global/find-all.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

@Controller('movie-genres')
export class MovieGenresController {
  constructor(private readonly movieGenresService: MovieGenresService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo mối quan hệ phim-thể loại mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo thành công',
    type: MovieGenreResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Mối quan hệ đã tồn tại' })
  @ApiResponse({ status: 400, description: 'Movie ID hoặc Genre ID không tồn tại' })
  async create(@Body() createMovieGenreDto: CreateMovieGenreDto) {
    return await this.movieGenresService.create(createMovieGenreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả mối quan hệ phim-thể loại' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang' })
  async findAll(@Query() paginationDto: FindAllDto) {
    return await this.movieGenresService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin mối quan hệ phim-thể loại theo ID' })
  @ApiParam({ name: 'id', description: 'ID của MovieGenre' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    type: MovieGenreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.movieGenresService.findOne(id);
  }

  @Get('movie/:movieId')
  @ApiOperation({ summary: 'Lấy tất cả thể loại của một phim' })
  @ApiParam({ name: 'movieId', description: 'ID của phim' })
  async findByMovieId(@Param('movieId', ParseIntPipe) movieId: number) {
    return await this.movieGenresService.findByMovieId(movieId);
  }

  @Get('genre/:genreId')
  @ApiOperation({ summary: 'Lấy tất cả phim thuộc một thể loại' })
  @ApiParam({ name: 'genreId', description: 'ID của thể loại' })
  async findByGenreId(@Param('genreId', ParseIntPipe) genreId: number) {
    return await this.movieGenresService.findByGenreId(genreId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật mối quan hệ phim-thể loại' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieGenreDto: UpdateMovieGenreDto,
  ) {
    return await this.movieGenresService.update(id, updateMovieGenreDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mối quan hệ phim-thể loại theo ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.movieGenresService.remove(id);
    return { 
      message: 'Xóa mối quan hệ phim-thể loại thành công',
      id 
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('movie/:movieId/genre/:genreId')
  @ApiOperation({ summary: 'Xóa mối quan hệ phim-thể loại cụ thể' })
  @ApiParam({ name: 'movieId', description: 'ID của phim' })
  @ApiParam({ name: 'genreId', description: 'ID của thể loại' })
  @HttpCode(HttpStatus.OK)
  async removeByMovieAndGenre(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('genreId', ParseIntPipe) genreId: number,
  ) {
    await this.movieGenresService.removeByMovieAndGenre(movieId, genreId);
    return { 
      message: 'Xóa mối quan hệ phim-thể loại thành công',
      movieId,
      genreId 
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('movie/:movieId/genres')
  @ApiOperation({ summary: 'Thêm nhiều thể loại cho một phim' })
  @ApiParam({ name: 'movieId', description: 'ID của phim' })
  @ApiResponse({ status: 201, description: 'Thêm thể loại thành công' })
  async addGenresToMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() addGenresToMovieDto: AddGenresToMovieDto,
  ) {
    return await this.movieGenresService.addGenresToMovie(movieId, addGenresToMovieDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('movie/:movieId/genres')
  @ApiOperation({ summary: 'Xóa nhiều thể loại khỏi một phim' })
  @ApiParam({ name: 'movieId', description: 'ID của phim' })
  @HttpCode(HttpStatus.OK)
  async removeGenresFromMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() body: { genreIds: number[] },
  ) {
    return await this.movieGenresService.removeGenresFromMovie(movieId, body.genreIds);
  }

  @Get('movies/by-genres')
  @ApiOperation({ summary: 'Lấy phim theo nhiều thể loại' })
  @ApiQuery({ 
    name: 'genreIds', 
    required: true, 
    description: 'Danh sách ID thể loại, cách nhau bởi dấu phẩy',
    example: '1,2,3'
  })
  async getMoviesByGenres(@Query('genreIds') genreIds: string) {
    const ids = genreIds.split(',').map(id => parseInt(id.trim()));
    return await this.movieGenresService.getMoviesByGenres(ids);
  }
}
