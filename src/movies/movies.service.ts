import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MovieGenresService } from 'src/movie-genres/movie-genres.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MovieCastsService } from 'src/movie-casts/movie-casts.service';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private movieGenresService: MovieGenresService,
    private cloudinaryService: CloudinaryService,
    private movieCastsService: MovieCastsService,
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
    
    // Debug logging
    console.log('Raw createMovieDto:', createMovieDto);
    console.log('Extracted genreIds:', genreIds, typeof genreIds);
    console.log('Extracted castIds:', castIds, typeof castIds);

    // Handle file uploads if files are provided
    const uploadedPaths = files ? await this.handleFileUploads(files) : {};
  
    // Combine movie data with uploaded paths and defaults
    const movieDataWithDefaults = {
      ...movieData,
      ...uploadedPaths,
      posterPath: uploadedPaths.posterPath || movieData.posterPath || 'default_poster.jpg',
      backdropPath: uploadedPaths.backdropPath || movieData.backdropPath || 'default_backdrop.jpg',
    };
  
    // Ensure genreIds and castIds are arrays
    const processedGenreIds = Array.isArray(genreIds) ? genreIds : 
                            typeof genreIds === 'string' ? JSON.parse(genreIds) : [];
    const processedCastIds = Array.isArray(castIds) ? castIds : 
                           typeof castIds === 'string' ? JSON.parse(castIds) : [];
    
    console.log('Processed genreIds:', processedGenreIds);
    console.log('Processed castIds:', processedCastIds);
  
    // Dùng transaction
    return this.prisma.$transaction(async (tx) => {
      const movie = await tx.movie.create({
        data: movieDataWithDefaults,
      });
  
      if (processedGenreIds.length > 0) {
        await this.movieGenresService.addGenresToMovie(movie.id, { genreIds: processedGenreIds });
      }
  
      if (processedCastIds.length > 0) {
        await this.movieCastsService.addCastsToMovie(movie.id, { castIds: processedCastIds });
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
    try {
      const { genreIds, castIds, ...movieData } = updateMovieDto;
      
      // Cập nhật thông tin cơ bản của movie
      const updatedMovie = await this.prisma.movie.update({
        where: { id },
        data: movieData,
      });
      
      // Cập nhật thể loại nếu có
      if (genreIds && genreIds.length > 0) {
        // Xóa tất cả thể loại cũ
        await this.prisma.movieGenre.deleteMany({
          where: { movieId: id },
        });
        
        // Thêm thể loại mới
        await this.movieGenresService.addGenresToMovie(id, { genreIds });
      }
      
      // Cập nhật diễn viên nếu có
      if (castIds && castIds.length > 0) {
        await this.prisma.movieCast.deleteMany({
          where: { movieId: id },
        });
        await this.movieCastsService.addCastsToMovie(id, { castIds });
      }
      
      return updatedMovie;
    } catch (error) {
      throw new NotFoundException(`Movie with ID ${id} not found: ${error.message}`);
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
  
  // async addGenresToMovie(movieId: number, genreIds: number[]) {
  //   // Kiểm tra movie có tồn tại không
  //   await this.findOne(movieId);
    
  //   // Tạo dữ liệu để insert
  //   const dataToInsert = genreIds.map(genreId => ({
  //     movieId,
  //     genreId
  //   }));

  //   // Sử dụng createMany để insert nhiều records
  //   const result = await this.prisma.movieGenre.createMany({
  //     data: dataToInsert,
  //     skipDuplicates: true // Bỏ qua các record trùng lặp
  //   });

  //   return {
  //     created: result.count,
  //     movieId,
  //     genreIds
  //   };
  // }
  
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
