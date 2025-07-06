import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShowTimeDto } from './dto/create-show-time.dto';
import { UpdateShowTimeDto } from './dto/update-show-time.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FindAllDto } from '../global/find-all.dto';

@Injectable()
export class ShowTimesService {
  constructor(private prisma: PrismaService) {}

  async create(createShowTimeDto: CreateShowTimeDto) {
    // Check if movie exists
    const movie = await this.prisma.movie.findUnique({
      where: { id: +createShowTimeDto.movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${createShowTimeDto.movieId} not found`);
    }

    // Check if theater exists
    const theater = await this.prisma.theater.findUnique({
      where: { id: createShowTimeDto.theaterId },
    });
    if (!theater) {
      throw new NotFoundException(`Theater with ID ${createShowTimeDto.theaterId} not found`);
    }

    return this.prisma.showtime.create({
      data: createShowTimeDto,
      include: {
        movie: true,
        theater: true,
      },
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

    const skip = (page - 1) * limit;
    const take = limit;

    const where = search
      ? {
          OR: [
            { movie: { title: { contains: search } } },
            { theater: { name: { contains: search } } },
          ],
        }
      : {};

    const [showtimes, total] = await Promise.all([
      this.prisma.showtime.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          movie: true,
          theater: true,
        },
      }),
      this.prisma.showtime.count({ where }),
    ]);

    return {
      data: showtimes,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const showtime = await this.prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: true,
        theater: true,
        bookings: true,
      },
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    return showtime;
  }

  async getShowtimesByMovieId(movieId: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }
    return await this.prisma.showtime.findMany({
      where: { movieId },
      include: {
        theater: true,
      },
    });
  }

  async update(id: number, updateShowTimeDto: UpdateShowTimeDto) {
    // Check if showtime exists
    const existingShowtime = await this.prisma.showtime.findUnique({
      where: { id },
    });

    if (!existingShowtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    // If movieId is provided, check if movie exists
    if (updateShowTimeDto.movieId) {
      const movie = await this.prisma.movie.findUnique({
        where: { id: updateShowTimeDto.movieId },
      });
      if (!movie) {
        throw new NotFoundException(`Movie with ID ${updateShowTimeDto.movieId} not found`);
      }
    }

    // If theaterId is provided, check if theater exists
    if (updateShowTimeDto.theaterId) {
      const theater = await this.prisma.theater.findUnique({
        where: { id: updateShowTimeDto.theaterId },
      });
      if (!theater) {
        throw new NotFoundException(`Theater with ID ${updateShowTimeDto.theaterId} not found`);
      }
    }

    return this.prisma.showtime.update({
      where: { id },
      data: updateShowTimeDto,
      include: {
        movie: true,
        theater: true,
      },
    });
  }

  async remove(id: number) {
    // Check if showtime exists
    const showtime = await this.prisma.showtime.findUnique({
      where: { id },
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    return this.prisma.showtime.delete({
      where: { id },
      include: {
        movie: true,
        theater: true,
      },
    });
  }
}
