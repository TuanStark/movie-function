import { IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    email: string;

    @IsString()
    role: string;

    @IsString()
    status: string;

    @IsString()
    avatar: string;
}
