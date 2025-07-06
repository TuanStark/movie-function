import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, Query, UploadedFile, UploadedFiles, UseInterceptors, HttpException, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth/jwt-auth.guard';
import { ResponseData } from '../global/globalClass';
import { HttpMessage } from '../global/globalEnum';
import { FindAllDto } from 'src/global/find-all.dto';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'posterFile', maxCount: 1 },
    { name: 'backdropFile', maxCount: 1 },
  ], {
    limits: { fileSize: 3000000 }, // 2MB limit
    fileFilter: (req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async create(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFiles() files: { posterFile?: Express.Multer.File[], backdropFile?: Express.Multer.File[] }
  ) {
    try {
      const movie = await this.moviesService.create(createMovieDto, files);
      return new ResponseData(movie, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'posterFile', maxCount: 1 },
    { name: 'backdropFile', maxCount: 1 },
  ], {
    limits: { fileSize: 2000000 }, // 2MB limit
    fileFilter: (req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFiles() files: { posterFile?: Express.Multer.File[], backdropFile?: Express.Multer.File[] }
  ) {
    try {
      const movie = await this.moviesService.update(+id, updateMovieDto);
      return new ResponseData(movie, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: string) {
    const movie = await this.moviesService.remove(+id);
    return new ResponseData(movie, HttpStatus.OK, HttpMessage.DELETED);
  }

  @Get()
  async findAll(@Query() query: FindAllDto) {
    try {
      const movies = await this.moviesService.findAll(query);
      return new ResponseData(movies, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: string) {
    try {
      const movie = await this.moviesService.findOne(+id);
      return new ResponseData(movie, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
