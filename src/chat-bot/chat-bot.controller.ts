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
  async handleChat(@Body('message') message: string) {
    return this.chatBotService.processUserQuery(message);
  }

}
