import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from './create-movie.dto';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  posterPath?: string;

  @IsString()
  @IsOptional()
  backdropPath?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsString()
  @IsOptional()
  synopsis?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  director?: string;

  @IsString()
  @IsOptional()
  writer?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  actors?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  releaseDate?: Date;

  @IsString()
  @IsOptional()
  trailerUrl?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  upcoming?: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return undefined;
      }
    }
    return value;
  })
  genreIds?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return undefined;
      }
    }
    return value;
  })
  castIds?: number[];
}
