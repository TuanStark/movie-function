import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, Query, UploadedFile, UploadedFiles, UseInterceptors, HttpException, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth/jwt-auth.guard';
import { ResponseData } from '../global/globalClass';
import { HttpMessage } from '../global/globalEnum';

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
    limits: { fileSize: 2000000 }, // 2MB limit
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
      // Upload poster image if provided
      if (files.posterFile && files.posterFile[0]) {
        const result = await this.cloudinaryService.uploadImage(files.posterFile[0], {
          folder: 'movieTix',
        });
        createMovieDto.posterPath = result.secure_url;
      }

      // Upload backdrop image if provided
      if (files.backdropFile && files.backdropFile[0]) {
        const result = await this.cloudinaryService.uploadImage(files.backdropFile[0], {
          folder: 'movieTix',
        });
        createMovieDto.backdropPath = result.secure_url;
      }
      
      const movie = await this.moviesService.create(createMovieDto);
      return new ResponseData(movie, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    const movies = await this.moviesService.findAll();
    return new ResponseData(movies, HttpStatus.OK, HttpMessage.SUCCESS);
  }
  
  @Get('by-genres')
  async getMoviesByGenres(@Query('genreIds') genreIds: string) {
    const ids = genreIds.split(',').map(id => parseInt(id.trim()));
    const movies = await this.moviesService.getMoviesByGenres(ids);
    return new ResponseData(movies, HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const movie = await this.moviesService.findOne(id);
    return new ResponseData(movie, HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    const movie = await this.moviesService.update(id, updateMovieDto);
    return new ResponseData(movie, HttpStatus.OK, HttpMessage.UPDATED);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.moviesService.remove(id);
    return new ResponseData(result, HttpStatus.OK, HttpMessage.DELETED);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':id/genres')
  @HttpCode(HttpStatus.CREATED)
  async addGenresToMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { genreIds: number[] },
  ) {
    const result = await this.moviesService.addGenresToMovie(id, body.genreIds);
    return new ResponseData(result, HttpStatus.CREATED, HttpMessage.CREATED);
  }
  
  @UseGuards(JwtAuthGuard)
  @Delete(':id/genres')
  @HttpCode(HttpStatus.OK)
  async removeGenresFromMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { genreIds: number[] },
  ) {
    const result = await this.moviesService.removeGenresFromMovie(id, body.genreIds);
    return new ResponseData(result, HttpStatus.OK, HttpMessage.DELETED);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/poster')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPoster(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadImage(file, {
        folder: 'movieTix/posters',
      });
      
      // Update movie with new posterPath
      const movie = await this.moviesService.update(id, {
        posterPath: result.secure_url,
      });
      
      return new ResponseData(
        { url: result.secure_url, movie },
        HttpStatus.OK,
        'Poster uploaded successfully'
      );
    } catch (error) {
      throw new HttpException(`Upload failed: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':id/backdrop')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackdrop(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadImage(file, {
        folder: 'movieTix/backdrops',
      });
      
      // Update movie with new backdropPath
      const movie = await this.moviesService.update(id, {
        backdropPath: result.secure_url,
      });
      
      return new ResponseData(
        { url: result.secure_url, movie },
        HttpStatus.OK,
        'Backdrop uploaded successfully'
      );
    } catch (error) {
      throw new HttpException(`Upload failed: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
