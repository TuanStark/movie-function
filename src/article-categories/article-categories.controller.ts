import { Controller, Get, Post, Body, Param, Delete, Query, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { ArticleCategoriesService } from './article-categories.service';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { FindAllDto } from 'src/global/find-all.dto';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from 'src/global/globalEnum';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

@Controller('article-categories')
export class ArticleCategoriesController {

  constructor(private readonly articleCategoriesService: ArticleCategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createArticleCategoryDto: CreateArticleCategoryDto) {
    try {
      const categories = await this.articleCategoriesService.create(createArticleCategoryDto);
      return new ResponseData(categories, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll(@Query() Query: FindAllDto) {
    try {
      const categories = await this.articleCategoriesService.findAll(Query);
      return new ResponseData(categories, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const categories = await this.articleCategoriesService.findOne(+id);
      return new ResponseData(categories, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const categories = await this.articleCategoriesService.remove(+id);
      return new ResponseData(categories, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
