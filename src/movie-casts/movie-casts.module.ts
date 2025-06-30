import { Module } from '@nestjs/common';
import { MovieCastsService } from './movie-casts.service';
import { MovieCastsController } from './movie-casts.controller';

@Module({
  controllers: [MovieCastsController],
  providers: [MovieCastsService],
  exports: [MovieCastsService],
})
export class MovieCastsModule {}
