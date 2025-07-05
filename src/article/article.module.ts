import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArticleCategoriesService } from 'src/article-categories/article-categories.service';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [UserModule, CloudinaryModule],
  controllers: [ArticleController],
  providers: [ArticleService, PrismaService, ArticleCategoriesService, UserService],
})
export class ArticleModule {}
