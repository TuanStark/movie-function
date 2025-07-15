import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class ChatBotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async processUserQuery(message: string) {
    const { intent, filters } = await this.gemini.analyze(message);

    // Helper function để parse date - giờ đây chỉ cần parse YYYY-MM-DD
    const parseDate = (dateStr: string): Date | undefined => {
      if (!dateStr) return undefined;

      // Gemini giờ đây sẽ trả về ngày cụ thể theo định dạng YYYY-MM-DD
      const parsed = new Date(dateStr + 'T00:00:00.000Z');
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    // Helper function để format ngày thành tiếng Việt
    const formatDateVN = (dateStr: string): string => {
      if (!dateStr) return '';

      const date = parseDate(dateStr);
      if (!date) return dateStr;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      // So sánh ngày
      if (date.getTime() === today.getTime()) {
        return `hôm nay (${date.toLocaleDateString('vi-VN')})`;
      } else if (date.getTime() === tomorrow.getTime()) {
        return `ngày mai (${date.toLocaleDateString('vi-VN')})`;
      } else if (date.getTime() === yesterday.getTime()) {
        return `hôm qua (${date.toLocaleDateString('vi-VN')})`;
      } else {
        return date.toLocaleDateString('vi-VN');
      }
    };

    switch (intent) {
      case 'get_movies':
        const movieDate = parseDate(filters.date);
        const movies = await this.prisma.movie.findMany({
          where: {
            genres: filters.genre
              ? {
                  some: {
                    genre: {
                      name: { contains: filters.genre, mode: 'insensitive' },
                    },
                  },
                }
              : undefined,
            showtimes: movieDate
              ? {
                  some: {
                    date: movieDate,
                  },
                }
              : undefined,
          },
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
            showtimes: {
              include: {
                theater: true,
              },
            },
          },
        });

        return {
          message: `Tôi đã tìm thấy ${movies.length} phim${filters.genre ? ` thể loại ${filters.genre}` : ''}${filters.date ? ` vào ${formatDateVN(filters.date)}` : ''}`,
          data: movies,
          filters: {
            ...filters,
            dateFormatted: filters.date ? formatDateVN(filters.date) : undefined,
          },
        };

      case 'get_showtimes':
        const showtimeDate = parseDate(filters.date);
        const showtimes = await this.prisma.showtime.findMany({
          where: {
            theater: filters.theater
              ? { name: { contains: filters.theater, mode: 'insensitive' } }
              : undefined,
            date: showtimeDate,
            movie: filters.movie
              ? { title: { contains: filters.movie, mode: 'insensitive' } }
              : undefined,
          },
          include: { movie: true, theater: true },
        });

        let messageText = `Tôi đã tìm thấy ${showtimes.length} suất chiếu`;
        if (filters.movie) messageText += ` phim ${filters.movie}`;
        if (filters.theater) messageText += ` tại rạp ${filters.theater}`;
        if (filters.date) messageText += ` vào ${formatDateVN(filters.date)}`;

        return {
          message: messageText,
          data: showtimes,
          filters: {
            ...filters,
            dateFormatted: filters.date ? formatDateVN(filters.date) : undefined,
          },
        };

      case 'book_ticket':
        const bookingDate = parseDate(filters.date);
        const dateFormatted = filters.date ? formatDateVN(filters.date) : 'không xác định';

        return {
          message: `Bạn muốn đặt vé phim ${filters.movie || 'không xác định'} tại rạp ${filters.theater || 'không xác định'} vào ${dateFormatted} lúc ${filters.time || 'không xác định'}?`,
          filters: {
            ...filters,
            dateFormatted: dateFormatted,
            parsedDate: bookingDate?.toISOString(),
          },
        };

      case 'get_promotions':
        return this.prisma.promotion.findMany({
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        });

      case 'get_reviews':
        return this.prisma.movieReview.findMany({
          where: filters.movie
            ? {
                movie: {
                  title: { contains: filters.movie, mode: 'insensitive' },
                },
              }
            : undefined,
          include: {
            movie: true,
            user: true,
          },
        });

      case 'general':
        return {
          message: 'Tôi có thể giúp bạn:\n- Tìm kiếm phim\n- Xem lịch chiếu\n- Đặt vé\n- Xem khuyến mãi\n- Đọc đánh giá phim\n\nBạn muốn làm gì?',
          suggestions: [
            'Phim hành động nào hay?',
            'Lịch chiếu hôm nay',
            'Rạp CGV có phim gì?',
            'Khuyến mãi tháng này',
          ],
        };

      default:
        return {
          message: 'Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể hỏi về phim, lịch chiếu, đặt vé, hoặc khuyến mãi.',
          intent: intent,
          filters: filters,
        };
    }
  }
}