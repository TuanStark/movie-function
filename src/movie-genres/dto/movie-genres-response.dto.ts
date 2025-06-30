export class MovieGenreResponseDto {
    id: number;
  
    movieId: number;
  
    genreId: number;
  
    movie?: {
      id: number;
      title: string;
    };
  
    genre?: {
      id: number;
      name: string;
    };
  }
  