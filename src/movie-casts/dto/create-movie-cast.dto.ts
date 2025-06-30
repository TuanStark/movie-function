import { IsInt, IsNotEmpty } from "class-validator";

export class CreateMovieCastDto {
    @IsInt()
    @IsNotEmpty()
    movieId: number;
  
    @IsInt()
    @IsNotEmpty()
    actorId: number;
}
