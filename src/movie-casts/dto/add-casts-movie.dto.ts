import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt } from "class-validator";

export class AddCastsToMovieDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Type(() => Number)
    castIds: number[];
}