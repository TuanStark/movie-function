import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class CreateArticleDto {
    @IsString()
    title: string;

    @IsString()
    excerpt: string;

    @IsString()
    content: string;

    @IsString()
    imagePath: string;

    @IsNumber()
    @Type(() => Number)
    categoryId: number;

    @IsNumber()
    @Type(() => Number)
    authorId: number;
    
    date: Date;

    @IsNumber()
    @Type(() => Number)
    readTime: number;
}
