import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ImageController } from './cloudinary/cloundinary.controler';
import { MoviesModule } from './movies/movies.module';
import { TheatersModule } from './theaters/theaters.module';
import { GenresModule } from './genres/genres.module';
import { ActorsModule } from './actors/actors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    CloudinaryModule,
    MoviesModule,
    TheatersModule,
    GenresModule,
    ActorsModule
  ],
  controllers: [AppController, ImageController],
  providers: [AppService],
})
export class AppModule {}
