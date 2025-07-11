import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsArray, Min, IsString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  showtimeId: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value.split(',').map(id => parseInt(id.trim(), 10));
      }
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsNotEmpty()
  seatIds: number[];

  @IsOptional()
  @IsString()
  @Type(() => String)
  status?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  images?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  email?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  phoneNumber?: string;

  @IsOptional()
  // @IsNumber()
  @Type(() => Number)
  promotionId?: number;
}