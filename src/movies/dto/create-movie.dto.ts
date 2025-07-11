import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  posterPath?: string;

  @IsString()
  @IsOptional()
  backdropPath?: string;

  @IsNumber()
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsOptional()
  synopsis: string;

  @IsString()
  duration: string;

  @IsString()
  director: string;

  @IsString()
  @IsOptional()
  writer: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  language: string;

  @IsString()
  @IsOptional()
  actors: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsString()
  trailerUrl: string;

  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  upcoming: boolean;

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
