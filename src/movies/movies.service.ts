import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MovieGenresService } from 'src/movie-genres/movie-genres.service';
import { MovieCastsService } from 'src/movie-casts/movie-casts.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService,
    private movieGenresService: MovieGenresService,
    private cloudinaryService: CloudinaryService,
    private movieCastsService: MovieCastsService,
  ) {}

  async create(createMovieDto: CreateMovieDto) {
    const { genreIds, castIds, ...movieData } = createMovieDto;

    // Đảm bảo posterPath và backdropPath luôn có giá trị
    const movieDataWithDefaults = {
      ...movieData,
      posterPath: movieData.posterPath || 'default_poster.jpg',
      backdropPath: movieData.backdropPath || 'default_backdrop.jpg',
    };

    const movie = await this.prisma.movie.create({
      data: movieDataWithDefaults,
    });

    if (genreIds && genreIds.length > 0) {
      await this.movieGenresService.addGenresToMovie(movie.id, { genreIds });
    }

    if (castIds && castIds.length > 0) {
      await this.movieCastsService.addCastsToMovie(movie.id, { castIds });
    }

    return movie;
  }

  async findAll() {
    return this.prisma.movie.findMany({
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        casts: {
          include: {
            actor: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    try {
      return await this.prisma.movie.update({
        where: { id },
        data: updateMovieDto,
      });
    } catch (error) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
  }

  async remove(id: number) {
    try {
      // Xóa các mối quan hệ movie-genre trước
      await this.prisma.movieGenre.deleteMany({
        where: { movieId: id },
      });
      
      // Xóa các mối quan hệ movie-cast trước
      await this.prisma.movieCast.deleteMany({
        where: { movieId: id },
      });
      
      // Sau đó xóa movie
      await this.prisma.movie.delete({
        where: { id },
      });
      
      return { message: `Movie with ID ${id} deleted successfully` };
    } catch (error) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
  }
  
  async addGenresToMovie(movieId: number, genreIds: number[]) {
    // Kiểm tra movie có tồn tại không
    await this.findOne(movieId);
    
    // Tạo dữ liệu để insert
    const dataToInsert = genreIds.map(genreId => ({
      movieId,
      genreId
    }));

    // Sử dụng createMany để insert nhiều records
    const result = await this.prisma.movieGenre.createMany({
      data: dataToInsert,
      skipDuplicates: true // Bỏ qua các record trùng lặp
    });

    return {
      created: result.count,
      movieId,
      genreIds
    };
  }
  
  async removeGenresFromMovie(movieId: number, genreIds: number[]) {
    // Kiểm tra movie có tồn tại không
    await this.findOne(movieId);
    
    const deleteResult = await this.prisma.movieGenre.deleteMany({
      where: {
        movieId,
        genreId: { in: genreIds }
      }
    });

    return {
      deleted: deleteResult.count,
      movieId,
      genreIds
    };
  }
  
  async getMoviesByGenres(genreIds: number[]) {
    return await this.prisma.movie.findMany({
      where: {
        genres: {
          some: {
            genreId: { in: genreIds }
          }
        }
      },
      include: {
        genres: {
          include: {
            genre: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
  }
}
