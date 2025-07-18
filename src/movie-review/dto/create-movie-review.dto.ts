// movie-review.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateMovieReviewDto {
  @IsInt({ message: 'userId must be an integer' })
  @Type(() => Number)
  userId: number;

  @IsInt({ message: 'movieId must be an integer' })
  movieId: number;

  @IsInt({ message: 'rating must be an integer' })
  @Min(1, { message: 'rating must be at least 1' })
  @Max(5, { message: 'rating must not exceed 5' })
  rating: number;

  @IsString({ message: 'comment must be a string' })
  @IsOptional()
  comment?: string;
}