import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieGenreDto } from './dto/create-movie-genre.dto';
import { UpdateMovieGenreDto } from './dto/update-movie-genre.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FindAllDto } from 'src/global/find-all.dto';
import { AddGenresToMovieDto } from './dto/add-genres-movie.dto';

@Injectable()
export class MovieGenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMovieGenreDto: CreateMovieGenreDto) {
    try {
      return await this.prisma.movieGenre.create({
        data: createMovieGenreDto,
        include: {
          movie: {
            select: { id: true, title: true }
          },
          genre: {
            select: { id: true, name: true }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Phim đã có thể loại này rồi');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Movie ID hoặc Genre ID không tồn tại');
        }
      }
      throw error;
    }
  }

  async findAll(paginationDto: FindAllDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.movieGenre.findMany({
        skip,
        take: limit,
        include: {
          movie: {
            select: { id: true, title: true, posterPath: true }
          },
          genre: {
            select: { id: true, name: true }
          }
        },
        orderBy: { id: 'desc' }
      }),
      this.prisma.movieGenre.count()
    ]);

    return {
      data: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async findOne(id: number) {
    const movieGenre = await this.prisma.movieGenre.findUnique({
      where: { id },
      include: {
        movie: {
          select: { 
            id: true, 
            title: true, 
            posterPath: true,
            rating: true 
          }
        },
        genre: {
          select: { id: true, name: true }
        }
      }
    });

    if (!movieGenre) {
      throw new NotFoundException(`Không tìm thấy MovieGenre với ID ${id}`);
    }

    return movieGenre;
  }

  async findByMovieId(movieId: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID ${movieId}`);
    }
    return await this.prisma.movieGenre.findMany({
      where: { movieId },
      include: {
        genre: {
          select: { id: true, name: true }
        }
      },
      orderBy: { genre: { name: 'asc' } }
    });
  }

  async findByGenreId(genreId: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
    });
    if (!genre) {
      throw new NotFoundException(`Không tìm thấy thể loại với ID ${genreId}`);
    }
    return await this.prisma.movieGenre.findMany({
      where: { genreId },
      include: {
        movie: {
          select: { 
            id: true, 
            title: true, 
            posterPath: true,
            rating: true,
            releaseDate: true 
          }
        }
      },
      orderBy: { movie: { releaseDate: 'desc' } }
    });
  }
  

  async update(id: number, updateMovieGenreDto: UpdateMovieGenreDto) {
    await this.findOne(id);

    try {
      return await this.prisma.movieGenre.update({
        where: { id },
        data: updateMovieGenreDto,
        include: {
          movie: {
            select: { id: true, title: true }
          },
          genre: {
            select: { id: true, name: true }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Phim đã có thể loại này rồi');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại

    return await this.prisma.movieGenre.delete({
      where: { id }
    });
  }

  async removeByMovieAndGenre(movieId: number, genreId: number) {
    const movieGenre = await this.prisma.movieGenre.findFirst({
      where: { movieId, genreId }
    });

    if (!movieGenre) {
      throw new NotFoundException('Không tìm thấy mối quan hệ phim-thể loại này');
    }

    return await this.prisma.movieGenre.delete({
      where: { id: movieGenre.id }
    });
  }

  async addGenresToMovie(movieId: number, addGenresToMovieDto: AddGenresToMovieDto) {
    const { genreIds } = addGenresToMovieDto;
    
    // Kiểm tra movie có tồn tại không
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID ${movieId}`);
    }

    // Kiểm tra tất cả genres có tồn tại không
    const existingGenres = await this.prisma.genre.findMany({
      where: { id: { in: genreIds } }
    });

    if (existingGenres.length !== genreIds.length) {
      const existingIds = existingGenres.map(g => g.id);
      const missingIds = genreIds.filter(id => !existingIds.includes(id));
      throw new BadRequestException(`Không tìm thấy genres với IDs: ${missingIds.join(', ')}`);
    }

    // Tạo dữ liệu để insert
    const dataToInsert = genreIds.map(genreId => ({
      movieId,
      genreId
    }));

    try {
      // Sử dụng createMany để insert nhiều records
      const result = await this.prisma.movieGenre.createMany({
        data: dataToInsert,
        skipDuplicates: true // Bỏ qua các record trùng lặp
      });

      // Lấy danh sách đã tạo để trả về
      const createdRecords = await this.prisma.movieGenre.findMany({
        where: {
          movieId,
          genreId: { in: genreIds }
        },
        include: {
          genre: {
            select: { id: true, name: true }
          }
        }
      });

      return {
        created: result.count,
        data: createdRecords
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Một số thể loại đã tồn tại cho phim này');
        }
      }
      throw error;
    }
  }

  async removeGenresFromMovie(movieId: number, genreIds: number[]) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID ${movieId}`);
    }
    const deleteResult = await this.prisma.movieGenre.deleteMany({
      where: {
        movieId,
        genreId: { in: genreIds }
      }
    });

    return {
      deleted: deleteResult.count,
      message: `Đã xóa ${deleteResult.count} thể loại khỏi phim`
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
