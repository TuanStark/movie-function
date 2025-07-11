import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports:[PrismaModule, CloudinaryModule, PaymentModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
