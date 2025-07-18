import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMovieReviewDto } from './dto/create-movie-review.dto';
import { UpdateMovieReviewDto } from './dto/update-movie-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class MovieReviewService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMovieReviewDto) {
    // Kiểm tra xem user đã đánh giá phim này chưa
    const existingReview = await this.prisma.movieReview.findUnique({
      where: {
        userId_movieId: {
          userId: data.userId,
          movieId: data.movieId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('User has already reviewed this movie');
    }
    // Tạo review mới
    return this.prisma.movieReview.create({
      data,
    });
    // Middleware sẽ tự động cập nhật rating sau khi tạo
  }

  async getReviewsByMovie(movieId: number, query: FindAllDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (pageNumber < 1 || limitNumber < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }

    const take = limitNumber;
    const skip = (pageNumber - 1) * take;

    const where = { movieId };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [reviews, total] = await Promise.all([
      this.prisma.movieReview.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.movieReview.count({
        where,
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  // Get a specific review
  async getReview(userId: number, movieId: number) {
    return this.prisma.movieReview.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
      include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    });
  }

  // Update a review
  async update(userId: number, movieId: number, data: UpdateMovieReviewDto) {
    const review = await this.prisma.movieReview.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });

    if (!review) {
      throw new BadRequestException('Review not found');
    }

    return this.prisma.movieReview.update({
      where: {
        userId_movieId: { userId, movieId },
      },
      data,
    });
  }

  // Delete a review
  async delete(userId: number, movieId: number) {
    const review = await this.prisma.movieReview.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });

    if (!review) {
      throw new BadRequestException('Review not found');
    }

    await this.prisma.movieReview.delete({
      where: {
        userId_movieId: { userId, movieId },
      },
    });
  }
}
