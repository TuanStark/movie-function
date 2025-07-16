import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async analyze(message: string): Promise<{
    intent: string;
    filters: Record<string, string>;
    message?: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const today = new Date();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const prompt = `
        Bạn là trợ lý AI của rạp chiếu phim.
        Nếu người dùng hỏi thông tin như phim, lịch chiếu, khuyến mãi,... hãy trả về JSON với intent + filters.
        Nếu người dùng chỉ muốn trò chuyện, hãy trả lời 1 cách tự nhiên (bằng tiếng Việt).

        Filters: genre, movie, theater, date (YYYY-MM-DD), time

        Hôm nay: ${today.toISOString().split('T')[0]}
        Ngày mai: ${tomorrow.toISOString().split('T')[0]}
        Hôm qua: ${yesterday.toISOString().split('T')[0]}

        Câu hỏi: "${message}"

        Trả về JSON thuần, KHÔNG markdown, KHÔNG giải thích. Ví dụ:
        {"intent": "chat", "filters": {}}
      `;
      console.log('[GeminiService] Analyzing:', prompt);

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();

      // Cleanup markdown hoặc định dạng
      text = text.replace(/```json\s*|\s*```/g, '').replace(/```\s*|\s*```/g, '');
      text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

      console.log('[GeminiService] Raw response:', text);

      const parsed = JSON.parse(text);

      if (!parsed.intent || typeof parsed.filters !== 'object') {
        throw new Error('Invalid format');
      }

      // Nếu là chat → trả về intent chat để ChatBotService xử lý
      if (parsed.intent === 'chat') {
        return {
          intent: 'chat',
          filters: { originalMessage: message },
        };
      }

      // Map tiếng Anh sang tiếng Việt nếu có genre
      const genreMap: Record<string, string> = {
        action: 'Hành động',
        comedy: 'Hài',
        horror: 'Kinh Dị',
        'sci-fi': 'Khoa học viễn tưởng',
        romance: 'Tình cảm/lãng mạn',
        animation: 'Hoạt Hình',
        adventure: 'Phiêu lưu',
        crime: 'Tội phạm',
        drama: 'Kịch',
        history: 'Lịch sử',
        thriller: 'Giật gân',
        family: 'Gia đình',
      };

      const filters = parsed.filters || {};
      if (filters.genre) {
        filters.genre = genreMap[filters.genre.toLowerCase()] || filters.genre;
      }

      return { intent: parsed.intent, filters };
    } catch (err) {
      console.error('[GeminiService] Lỗi phân tích:', err);
      console.error('[GeminiService] Message:', message);
      return this.fallbackAnalyze(message);
    }
  }

  private fallbackAnalyze(message: string): {
    intent: string;
    filters: Record<string, string>;
    message?: string;
  } {
    const lower = message.toLowerCase();
    const filters: Record<string, string> = {};
    let intent = 'general';

    if (
      lower.includes('chào') ||
      lower.includes('cảm ơn') ||
      lower.includes('khỏe không') ||
      lower.includes('bạn là ai')
    ) {
      return {
        intent: 'chat',
        filters: { originalMessage: message },
      };
    }

    if (lower.includes('phim') || lower.includes('movie')) {
      if (lower.includes('suất chiếu') || lower.includes('lịch chiếu') || lower.includes('showtime')) {
        intent = 'get_showtimes';
      } else if (lower.includes('đặt vé') || lower.includes('book')) {
        intent = 'book_ticket';
      } else if (lower.includes('đánh giá') || lower.includes('review')) {
        intent = 'get_reviews';
      } else {
        intent = 'get_movies';
      }
    } else if (lower.includes('khuyến mãi') || lower.includes('promotion')) {
      intent = 'get_promotions';
    }

    // Genre mapping (việt hóa)
    if (lower.includes('hành động')) filters.genre = 'Hành động';
    else if (lower.includes('hài')) filters.genre = 'Hài';
    else if (lower.includes('kinh dị')) filters.genre = 'Kinh Dị';
    else if (lower.includes('khoa học')) filters.genre = 'Khoa học viễn tưởng';
    else if (lower.includes('hoạt hình')) filters.genre = 'Hoạt Hình';
    else if (lower.includes('tình cảm') || lower.includes('lãng mạn')) filters.genre = 'Tình cảm/lãng mạn';
    else if (lower.includes('giật gân')) filters.genre = 'Giật gân';
    else if (lower.includes('gia đình')) filters.genre = 'Gia đình';

    if (lower.includes('cgv')) filters.theater = 'CGV';
    else if (lower.includes('lotte')) filters.theater = 'Lotte';

    if (lower.includes('hôm nay') || lower.includes('today')) {
      filters.date = new Date().toISOString().split('T')[0];
    } else if (lower.includes('ngày mai') || lower.includes('tomorrow')) {
      const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
      filters.date = tmr.toISOString().split('T')[0];
    } else if (lower.includes('hôm qua') || lower.includes('yesterday')) {
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      filters.date = yest.toISOString().split('T')[0];
    }

    const timeMatch = message.match(/\b(\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?)\b/);
    if (timeMatch) filters.time = timeMatch[1];

    return { intent, filters };
  }

  async generateChatResponse(message: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(`
        Bạn là trợ lý AI thân thiện cho hệ thống rạp chiếu phim. Hãy trả lời tin nhắn của người dùng một cách tự nhiên và thân thiện.

        Tin nhắn của người dùng: "${message}"

        Hướng dẫn trả lời:
        - Trả lời bằng tiếng Việt tự nhiên, thân thiện
        - Nếu người dùng chào hỏi, hãy chào lại và giới thiệu bản thân
        - Nếu người dùng hỏi về khả năng, hãy giải thích bạn có thể giúp gì về phim ảnh
        - Nếu người dùng cảm ơn, hãy đáp lại lịch sự
        - Nếu người dùng hỏi câu hỏi chung, hãy trả lời và gợi ý về dịch vụ phim
        - Luôn giữ tông giọng vui vẻ, hữu ích
        - Không trả lời quá dài, khoảng 1-2 câu
        - Có thể sử dụng emoji phù hợp

        Ví dụ:
        - "Hello" → "Xin chào! Tôi là trợ lý AI của rạp phim. Tôi có thể giúp bạn tìm phim, xem lịch chiếu, hoặc đặt vé. Bạn cần hỗ trợ gì? 🎬"
        - "Cảm ơn" → "Không có gì! Tôi luôn sẵn sàng giúp bạn về mọi thứ liên quan đến phim ảnh. 😊"
        - "Bạn là ai?" → "Tôi là trợ lý AI của hệ thống rạp chiếu phim, có thể giúp bạn tìm phim hay, xem lịch chiếu và đặt vé một cách dễ dàng! 🤖"

        Trả lời ngắn gọn:
      `);

      return result.response.text().trim();
    } catch (err) {
      console.error('[GeminiService] Lỗi tạo chat response:', err);

      // Fallback responses
      const lower = message.toLowerCase();

      if (lower.includes('chào') || lower.includes('hi') || lower.includes('hello')) {
        return 'Xin chào! Tôi là trợ lý AI của rạp phim. Tôi có thể giúp bạn tìm phim, xem lịch chiếu, hoặc đặt vé. Bạn cần hỗ trợ gì? 🎬';
      } else if (lower.includes('cảm ơn') || lower.includes('thank')) {
        return 'Không có gì! Tôi luôn sẵn sàng giúp bạn về mọi thứ liên quan đến phim ảnh. 😊';
      } else if (lower.includes('bạn là ai') || lower.includes('who are you')) {
        return 'Tôi là trợ lý AI của hệ thống rạp chiếu phim, có thể giúp bạn tìm phim hay, xem lịch chiếu và đặt vé một cách dễ dàng! 🤖';
      } else if (lower.includes('khỏe không') || lower.includes('how are you')) {
        return 'Tôi rất ổn, cảm ơn bạn đã hỏi! Tôi có thể giúp bạn tìm phim hay gì không? 😊';
      } else if (lower.includes('tạm biệt') || lower.includes('bye')) {
        return 'Tạm biệt! Hẹn gặp lại bạn và chúc bạn xem phim vui vẻ! 👋';
      } else {
        return 'Tôi có thể giúp bạn tìm phim, xem lịch chiếu, đặt vé và nhiều thứ khác về phim ảnh. Bạn muốn làm gì? 🎭';
      }
    }
  }
}
