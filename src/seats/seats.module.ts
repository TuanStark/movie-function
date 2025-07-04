import { Module } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SeatsController],
  providers: [SeatsService],
})
export class SeatsModule {}
