import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MovieGenresModule } from 'src/movie-genres/movie-genres.module';
import { MovieCastsModule } from 'src/movie-casts/movie-casts.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, MovieGenresModule, MovieCastsModule],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
