import { IsString } from "class-validator";

export class CreateArticleCategoryDto {

    @IsString()
    name: string;
}
