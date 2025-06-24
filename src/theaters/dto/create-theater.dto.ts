import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTheaterDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    logo?: string;

    @IsNotEmpty()
    @IsString()
    location: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}
