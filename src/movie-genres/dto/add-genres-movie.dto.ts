import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt } from "class-validator";

export class AddGenresToMovieDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Type(() => Number)
    genreIds: number[];
  }