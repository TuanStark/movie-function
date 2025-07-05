import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class ArticleCategoriesService {
  constructor(private readonly prisma: PrismaService){}

  async create(createArticleCategoryDto: CreateArticleCategoryDto) {
    try {
      const category = await this.prisma.articleCategory.create({
        data:  createArticleCategoryDto
      })
      return category;
    } catch (error) {
      throw new Error('Create Fail');
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

    if(pageNumber < 1 || limitNumber < 1) {
      throw new Error('Page and limit must be greater than 0');
    }

    const take = limitNumber;
    const skip = (pageNumber - 1) * take;

    const searchUpCase = search.charAt(0).toUpperCase() + search.slice(1);
    const where = search
      ? {
        OR: [
          { name: { contains: searchUpCase } },
        ]
      }
      : {};
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [categories, total] = await Promise.all([
      this.prisma.articleCategory.findMany({
        where: where,
        orderBy: orderBy,
        skip,
        take,
      }),
      this.prisma.articleCategory.count({
        where: where,
      })
    ])

    return {
      data: categories,
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
      const categories = await this.prisma.articleCategory.findUnique({
        where : {
          id : id
        }
      })
      if(!categories){
        throw new NotFoundException('Not found category');
      }
      return categories;
    } catch (error) {
      throw new Error('find Fail');
    }
  }

  async remove(id: number) {
    try {
      const categories =  await this.findOne(id);

      if(!categories){
        throw new NotFoundException('Not found category');
      }

      return await this.prisma.articleCategory.delete({
        where: {
          id : id
        }
      })
    } catch (error) {
      throw new Error('Delete Fail');
    }
  }
}
