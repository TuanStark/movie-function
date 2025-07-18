import { Module } from '@nestjs/common';
import { MovieReviewService } from './movie-review.service';
import { MovieReviewController } from './movie-review.controller';

@Module({
  controllers: [MovieReviewController],
  providers: [MovieReviewService],
})
export class MovieReviewModule {}
