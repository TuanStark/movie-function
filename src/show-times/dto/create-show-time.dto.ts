import { IsDate, IsNumber, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateShowTimeDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  movieId: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  theaterId: number;

  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => {
    if (value instanceof Date) return value;
    return new Date(value);
  })
  date: Date;

  @IsString()
  @Type(() => String)
  time: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  price: number;
}
