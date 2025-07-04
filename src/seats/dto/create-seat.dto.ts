import { IsInt, IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateSeatDto {
@IsInt()
  @IsNotEmpty()
  theaterId: number;

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
