import { IsInt, IsNotEmpty } from "class-validator";

export class CreateMovieGenreDto {
  @IsInt()
  @IsNotEmpty()
  movieId: number;

  @IsInt()
  @IsNotEmpty()
  genreId: number;
}
