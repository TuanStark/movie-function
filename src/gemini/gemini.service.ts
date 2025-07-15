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

  async analyze(message: string): Promise<{ intent: string; filters: Record<string, string> }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const today = new Date();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const prompt = `
        Phân tích câu hỏi người dùng và trả về JSON với intent + filters.
        Intent: get_movies | get_showtimes | book_ticket | get_promotions | get_reviews | general

        Filters: genre, movie, theater, date (YYYY-MM-DD), time

        Hôm nay: ${today.toISOString().split('T')[0]}
        Ngày mai: ${tomorrow.toISOString().split('T')[0]}
        Hôm qua: ${yesterday.toISOString().split('T')[0]}

        Câu hỏi: "${message}"

        Trả về JSON thuần, KHÔNG markdown, KHÔNG giải thích. Ví dụ:
        {"intent": "get_movies", "filters": {"genre": "action"}}
      `;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();

      // Cleanup markdown or formatting
      text = text.replace(/```json\s*|\s*```/g, '').replace(/```\s*|\s*```/g, '');
      text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

      console.log('[GeminiService] Raw response:', text);

      const parsed = JSON.parse(text);

      if (!parsed.intent || typeof parsed.filters !== 'object') {
        throw new Error('Invalid format');
      }

      // Normalize genre mapping
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

  private fallbackAnalyze(message: string): { intent: string; filters: Record<string, string> } {
    const lower = message.toLowerCase();
    const filters: Record<string, string> = {};
    let intent = 'general';

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

    // Optional: detect time
    const timeMatch = message.match(/\b(\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?)\b/);
    if (timeMatch) filters.time = timeMatch[1];

    return { intent, filters };
  }
}
