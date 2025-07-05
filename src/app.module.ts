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
import { MovieCastsModule } from './movie-casts/movie-casts.module';
import { MovieGenresModule } from './movie-genres/movie-genres.module';
import { ShowTimesModule } from './show-times/show-times.module';
import { BookingModule } from './booking/booking.module';
import { SeatsModule } from './seats/seats.module';
import { ArticleCategoriesModule } from './article-categories/article-categories.module';
import { ArticleModule } from './article/article.module';

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
    ActorsModule,
    MovieCastsModule,
    MovieGenresModule,
    ShowTimesModule,
    BookingModule,
    SeatsModule,
    ArticleCategoriesModule,
    ArticleModule,
  ],
  controllers: [AppController, ImageController],
  providers: [AppService],
})
export class AppModule {}
