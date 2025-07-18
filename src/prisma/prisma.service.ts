import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
    });
    console.log('db url :' + configService.get('DATABASE_URL'));
  }

  async onModuleInit() {
    // Đăng ký middleware
    this.$use(async (params, next) => {
      const result = await next(params);

      // Cập nhật rating khi có thay đổi trong MovieReview
      if (params.model === 'MovieReview' && ['create', 'update', 'delete'].includes(params.action)) {
        const movieId = params.args.data?.movieId || result.movieId;
        if (movieId) {
          await this.updateMovieRating(movieId);
        }
      }

      return result;
    });
  }
  async updateMovieRating(movieId: number) {
    // Tính trung bình rating
    const reviews = await this.movieReview.aggregate({
      where: { movieId },
      _avg: { rating: true },
    });

    const avgRating = reviews._avg.rating || 0;

    // Cập nhật rating trong bảng Movie
    await this.movie.update({
      where: { id: movieId },
      data: { rating: avgRating },
    });
  }
}
