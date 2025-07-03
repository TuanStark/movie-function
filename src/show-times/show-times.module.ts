import { Module } from '@nestjs/common';
import { ShowTimesService } from './show-times.service';
import { ShowTimesController } from './show-times.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShowTimesController],
  providers: [ShowTimesService],
  exports: [ShowTimesService],
})
export class ShowTimesModule {}
