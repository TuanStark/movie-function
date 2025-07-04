import { IsInt, IsNotEmpty, IsString, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SeatDto {
  @IsString()
  @IsNotEmpty()
  row: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  number: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;
}

export class BulkCreateSeatDto {
  @IsInt()
  @IsNotEmpty()
  theaterId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  @IsNotEmpty()
  seats: SeatDto[];
}