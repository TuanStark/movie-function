import { Module } from '@nestjs/common';
import { ChatBotService } from './chat-bot.service';
import { ChatBotController } from './chat-bot.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GeminiService } from 'src/gemini/gemini.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ChatBotController],
  providers: [ChatBotService, GeminiService],
})
export class ChatBotModule {}
