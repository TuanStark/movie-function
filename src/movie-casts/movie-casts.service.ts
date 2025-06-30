import { ConflictException, Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { CreateMovieCastDto } from './dto/create-movie-cast.dto';
import { UpdateMovieCastDto } from './dto/update-movie-cast.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AddCastsToMovieDto } from './dto/add-casts-movie.dto';
import { NotFoundException } from '@nestjs/common';


@Injectable()
export class MovieCastsService {
  constructor(private prisma: PrismaService) {}


  async create(createMovieCastDto: CreateMovieCastDto) {
    try {
      return await this.prisma.movieCast.create({
        data: {
          ...createMovieCastDto,
        },
        include: {
          movie: {
            select: { id: true, title: true }
          },
          actor: {
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

  findAll() {
    return `This action returns all movieCasts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} movieCast`;
  }

  update(id: number, updateMovieCastDto: UpdateMovieCastDto) {
    return `This action updates a #${id} movieCast`;
  }

  remove(id: number) {
    return `This action removes a #${id} movieCast`;
  }

  async addCastsToMovie(movieId: number, addCastsToMovieDto: AddCastsToMovieDto) {
    const { castIds } = addCastsToMovieDto;
    
    // Kiểm tra movie có tồn tại không
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID ${movieId}`);
    }

    // Kiểm tra tất cả genres có tồn tại không
    const existingCasts = await this.prisma.actor.findMany({
      where: { id: { in: castIds } }
    });

    if (existingCasts.length !== castIds.length) {
      const existingIds = existingCasts.map(c => c.id);
      const missingIds = castIds.filter(id => !existingIds.includes(id));
      throw new BadRequestException(`Không tìm thấy casts với IDs: ${missingIds.join(', ')}`);
    }

    // Tạo dữ liệu để insert
    const dataToInsert = castIds.map(castId => ({
      movieId,
      actorId: castId
    }));

    try {
      // Sử dụng createMany để insert nhiều records
      const result = await this.prisma.movieCast.createMany({
        data: dataToInsert,
        skipDuplicates: true // Bỏ qua các record trùng lặp
      });

      // Lấy danh sách đã tạo để trả về
      const createdRecords = await this.prisma.movieCast.findMany({
        where: {
          movieId,
          actorId: { in: castIds }
        },
        include: {
          actor: {
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
}
