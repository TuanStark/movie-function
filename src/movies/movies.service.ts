import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private async handleFileUploads(files: { posterFile?: Express.Multer.File[], backdropFile?: Express.Multer.File[] }) {
    const uploadedPaths: { posterPath?: string; backdropPath?: string } = {};

    if (files.posterFile && files.posterFile[0]) {
      const result = await this.cloudinaryService.uploadImage(files.posterFile[0], {
        folder: 'movieTix',
      });
      uploadedPaths.posterPath = result.secure_url;
    }

    if (files.backdropFile && files.backdropFile[0]) {
      const result = await this.cloudinaryService.uploadImage(files.backdropFile[0], {
        folder: 'movieTix',
      });
      uploadedPaths.backdropPath = result.secure_url;
    }

    return uploadedPaths;
  }

  async create(createMovieDto: CreateMovieDto, files?: { posterFile?: Express.Multer.File[], backdropFile?: Express.Multer.File[] }) {
    const { genreIds, castIds, ...movieData } = createMovieDto;
    // Handle file uploads if files are provided
    const uploadedPaths = files ? await this.handleFileUploads(files) : {};
    console.log(genreIds);
    console.log(castIds);

    // Combine movie data with uploaded paths and defaults
    const movieDataWithDefaults = {
      ...movieData,
      ...uploadedPaths,
      posterPath: uploadedPaths.posterPath || movieData.posterPath || 'default_poster.jpg',
      backdropPath: uploadedPaths.backdropPath || movieData.backdropPath || 'default_backdrop.jpg',
    };

    // Ensure genreIds and castIds are arrays
    const processedGenreIds = Array.isArray(genreIds) ? genreIds : typeof genreIds === 'string' ? JSON.parse(genreIds) : [];
    const processedCastIds = Array.isArray(castIds) ? castIds : typeof castIds === 'string' ? JSON.parse(castIds) : [];

    // Dùng transaction
    return this.prisma.$transaction(async (tx) => {
      const movie = await tx.movie.create({
        data: movieDataWithDefaults,
      });

      // Handle genres within the transaction
      if (processedGenreIds.length > 0) {
        // Validate that all genres exist
        const existingGenres = await tx.genre.findMany({
          where: { id: { in: processedGenreIds } }
        });

        if (existingGenres.length !== processedGenreIds.length) {
          const existingIds = existingGenres.map(g => g.id);
          const missingIds = processedGenreIds.filter((id: number) => !existingIds.includes(id));
          throw new BadRequestException(`Không tìm thấy genres với IDs: ${missingIds.join(', ')}`);
        }

        // Create movie-genre relationships
        const genreData = processedGenreIds.map((genreId: number) => ({
          movieId: movie.id,
          genreId
        }));

        await tx.movieGenre.createMany({
          data: genreData,
          skipDuplicates: true
        });
      }

      // Handle casts within the transaction
      if (processedCastIds.length > 0) {
        // Validate that all actors exist
        const existingCasts = await tx.actor.findMany({
          where: { id: { in: processedCastIds } }
        });

        if (existingCasts.length !== processedCastIds.length) {
          const existingIds = existingCasts.map(c => c.id);
          const missingIds = processedCastIds.filter((id: number) => !existingIds.includes(id));
          throw new BadRequestException(`Không tìm thấy casts với IDs: ${missingIds.join(', ')}`);
        }

        // Create movie-cast relationships
        const castData = processedCastIds.map((castId: number) => ({
          movieId: movie.id,
          actorId: castId
        }));

        await tx.movieCast.createMany({
          data: castData,
          skipDuplicates: true
        });
      }

      return movie;
    });
  }

  async findAll(query: FindAllDto) {
    const { 
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if(pageNumber < 1 || limitNumber < 1) {
      throw new Error('Page and limit must be greater than 0');
    }

    const take = limitNumber;
    const skip = (pageNumber - 1) * take;

    const searchUpCase = search.charAt(0).toUpperCase() + search.slice(1);
    const where = search
      ? {
        OR: [
          { title: { contains: searchUpCase } },
          { synopsis: { contains: searchUpCase } },
        ]
      }
      : {};
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [movies, total] = await Promise.all([
      this.prisma.movie.findMany({
        where: where,
        orderBy: orderBy,
        skip,
        take,
        include: {
          showtimes: {
            include: {
              movie: true,
            }
          },
          genres: {
            include: {
              genre: true,
            }
          },
          casts: {
            include: {
              actor: true,
            }
          }
        }
      }),
      this.prisma.movie.count({
        where: where,
      })
    ])

    return {
      data: movies,
      meta: {
        total,
        pageNumber,
        limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
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
        showtimes: {
          include: {
            theater: true,
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
    const { genreIds, castIds, ...movieData } = updateMovieDto;

    return this.prisma.$transaction(async (tx) => {
      // Kiểm tra movie có tồn tại không
      const existingMovie = await tx.movie.findUnique({
        where: { id },
      });

      if (!existingMovie) {
        throw new NotFoundException(`Movie with ID ${id} not found`);
      }

      // Cập nhật thông tin cơ bản của movie
      const updatedMovie = await tx.movie.update({
        where: { id },
        data: movieData,
      });

      // Cập nhật thể loại nếu có
      if (genreIds && genreIds.length > 0) {
        // Validate that all genres exist
        const existingGenres = await tx.genre.findMany({
          where: { id: { in: genreIds } }
        });

        if (existingGenres.length !== genreIds.length) {
          const existingIds = existingGenres.map(g => g.id);
          const missingIds = genreIds.filter((id: number) => !existingIds.includes(id));
          throw new BadRequestException(`Không tìm thấy genres với IDs: ${missingIds.join(', ')}`);
        }

        // Xóa tất cả thể loại cũ
        await tx.movieGenre.deleteMany({
          where: { movieId: id },
        });

        // Thêm thể loại mới
        const genreData = genreIds.map((genreId: number) => ({
          movieId: id,
          genreId
        }));

        await tx.movieGenre.createMany({
          data: genreData,
          skipDuplicates: true
        });
      }

      // Cập nhật diễn viên nếu có
      if (castIds && castIds.length > 0) {
        // Validate that all actors exist
        const existingCasts = await tx.actor.findMany({
          where: { id: { in: castIds } }
        });

        if (existingCasts.length !== castIds.length) {
          const existingIds = existingCasts.map(c => c.id);
          const missingIds = castIds.filter((id: number) => !existingIds.includes(id));
          throw new BadRequestException(`Không tìm thấy casts với IDs: ${missingIds.join(', ')}`);
        }

        // Xóa tất cả diễn viên cũ
        await tx.movieCast.deleteMany({
          where: { movieId: id },
        });

        // Thêm diễn viên mới
        const castData = castIds.map((castId: number) => ({
          movieId: id,
          actorId: castId
        }));

        await tx.movieCast.createMany({
          data: castData,
          skipDuplicates: true
        });
      }

      return updatedMovie;
    });
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
