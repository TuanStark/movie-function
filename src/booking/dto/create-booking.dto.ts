import { IsInt, IsNotEmpty, IsArray, Min, IsString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  showtimeId: number;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsNotEmpty()
  seatIds: number[];

  @IsOptional()
  @IsString()
  status?: string;
}