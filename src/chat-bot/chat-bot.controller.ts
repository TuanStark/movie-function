import { Body, Controller, Post } from '@nestjs/common';
import { ChatBotService } from './chat-bot.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('chat-bot')
export class ChatBotController {
  constructor(
    private readonly chatBotService: ChatBotService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async ask(@Body('question') question: string) {
    const sql = await this.chatBotService.generateSQL(question);
    try {
      const data = await this.prisma.$queryRawUnsafe(sql);

      // Tạo câu trả lời bằng tiếng Việt cho dữ liệu
      const answer = await this.chatBotService.answerQuestion(question, data as any[]);

      return {
        answer,
        sql,
        data
      };
    } catch (error) {
      return {
        answer: 'Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng thử lại với câu hỏi khác.',
        sql,
        error: 'Lỗi khi chạy SQL',
        detail: error.message
      };
    }
  }

}
