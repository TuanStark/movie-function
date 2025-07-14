// import { Injectable } from '@nestjs/common';
// import { CreateChatBotDto } from './dto/create-chat-bot.dto';
// import { UpdateChatBotDto } from './dto/update-chat-bot.dto';
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatBotService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateSQL(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(`
      Viết câu SQL PostgreSQL cho cơ sở dữ liệu rạp chiếu phim.

      QUAN TRỌNG: Sử dụng tên bảng và cột chính xác như sau:
      - Bảng phim: "movies" (không phải "Movie")
      - Các cột trong bảng movies: id, title, "posterPath", "backdropPath", rating, synopsis, duration, director, writer, country, language, actors, "releaseDate", "trailerUrl", upcoming, type, "createdAt", "updatedAt"
      - Bảng rạp: "theaters" với cột: id, name, logo, location, latitude, longitude
      - Bảng thể loại: "genres" với cột: id, name
      - Bảng liên kết phim-thể loại: "movieGenres" với cột: id, "movieId", "genreId"
      - Bảng suất chiếu: "showtimes" với cột: id, "movieId", "theaterId", date, time, price, surcharge
      - Bảng đặt vé: "bookings" với cột: id, "userId", "showtimeId", "totalPrice", "bookingDate", "bookingCode", status

      Lưu ý:
      - Tên bảng và cột có dấu ngoặc kép phải được bao quanh bởi dấu ngoặc kép trong SQL
      - Sử dụng CURRENT_DATE cho ngày hiện tại
      - Sử dụng NOW() cho thời gian hiện tại

      Câu hỏi: "${prompt}"
      Trả về SQL đơn giản bên trong markdown \`\`\`sql.
    `);

    const text = result.response.text();
    const match = text.match(/```sql\s*([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim(); // extract SQL
  }

  async answerQuestion(prompt: string, sqlData: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(`
      Bạn là trợ lý AI thông minh cho hệ thống rạp chiếu phim. Hãy trả lời câu hỏi của người dùng bằng tiếng Việt một cách tự nhiên và thân thiện.

      Câu hỏi của người dùng: "${prompt}"

      Dữ liệu từ cơ sở dữ liệu: ${JSON.stringify(sqlData, null, 2)}

      Hướng dẫn trả lời:
      - Trả lời các câu xin chào bằng các thứ tiếng khác nhau của người dùng
      - Trả lời bằng tiếng Việt tự nhiên, thân thiện, ngắn gọn, dễ hiểu,không cần liệt kê phim 
      - Nếu không có dữ liệu, thông báo lịch sự và gợi ý câu hỏi khác

      Trả lời:
    `);

    return result.response.text();
  }
}
