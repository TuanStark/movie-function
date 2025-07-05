import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArticleCategoriesService } from 'src/article-categories/article-categories.service';
import { UserService } from 'src/user/user.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService,
    private readonly categories: ArticleCategoriesService,
    private readonly user: UserService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  async create(createArticleDto: CreateArticleDto, file: Express.Multer.File) {
    try {
      const categories = await this.categories.findOne(createArticleDto.categoryId);

      if (!categories) {
        throw new NotFoundException("Not found categories");
      }
      const existingUser = await this.user.findOne(createArticleDto.authorId);

      if (!existingUser) {
        throw new NotFoundException("Not found User");
      }

      const imagePath = "imagePath.png"
      const article = await this.prisma.article.create({
        data: {
          ...createArticleDto,
          imagePath: imagePath,
          date: new Date()
        }
      })

      if (file) {
        try {
          const logo = await this.cloudinaryService.uploadImage(file);
          if (logo) {
            const updatedTheater = await this.prisma.article.update({
              where: { id: article.id },
              data: { imagePath: logo.secure_url },
            });
            return updatedTheater;
          }
        } catch (uploadError) {
          throw new BadRequestException(`Failed to upload logo: ${uploadError.message}`);
        }
      }
      return article;
    } catch (error) {
      throw new BadRequestException(`Failed to create theater: ${error.message}`);
    }
  }

  async findAll(query: FindAllDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (pageNumber < 1 || limitNumber < 1) {
      throw new Error('Page and limit must be greater than 0');
    }

    const take = limitNumber;
    const skip = (pageNumber - 1) * take;

    const searchUpCase = search.charAt(0).toUpperCase() + search.slice(1);
    const where = search
      ? {
        OR: [
          { title: { contains: searchUpCase } },
        ]
      }
      : {};
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: where,
        orderBy: orderBy,
        skip,
        take,
        include: {
          author: true,
          category: true
        }
      }),
      this.prisma.article.count({
        where: where,
      })
    ])

    return {
      data: articles,
      meta: {
        total,
        pageNumber,
        limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findOne(id: number) {
    try {
      const article = await this.prisma.article.findUnique({
        where: { id: id }
      });
      if (!article) {
        throw new NotFoundException("Not found article");
      }
      return article;
    } catch (error) {
      throw new BadRequestException(`Failed to create theater: ${error.message}`);
    }
  }

  async update(id: number, updateArticleDto: UpdateArticleDto, file: Express.Multer.File) {
    try {
      const existingArticle = await this.prisma.article.findUnique({
        where: { id: id }
      })

      if (!existingArticle) {
        throw new NotFoundException("Not found article!");
      }
      const imagePath = "imagePath.png"
      const article = await this.prisma.article.update({
        where: { id: id },
        data: {
          ...updateArticleDto,
          imagePath: imagePath,
          date: new Date(),
          updatedAt: new Date()
        }
      })

      if (file) {
        try {
          const logo = await this.cloudinaryService.uploadImage(file);
          if (logo) {
            const updatedArticle = await this.prisma.article.update({
              where: { id: article.id },
              data: { imagePath: logo.secure_url },
            });
            return updatedArticle;
          }
        } catch (uploadError) {
          throw new BadRequestException(`Failed to upload logo: ${uploadError.message}`);
        }
      }
      return article;
    } catch (error) {
      throw new BadRequestException(`Failed to create theater: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      const article = await this.findOne(id);

      if (!article) {
        throw new NotFoundException("Not found article");
      }

      const deleteArticle = await this.prisma.article.delete({
        where: { id: id }
      })
      return deleteArticle;
    } catch (error) {
      throw new BadRequestException(`Failed to create theater: ${error.message}`);
    }
  }
}
