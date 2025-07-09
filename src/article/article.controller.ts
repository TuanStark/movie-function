import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpStatus, HttpException, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from 'src/global/globalEnum';
import { FindAllDto } from 'src/global/find-all.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 3000000 },
    fileFilter: (req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  })) 
  async create(@Body() createArticleDto: CreateArticleDto, @UploadedFile() file: Express.Multer.File) {
    try {
      const article = await this.articleService.create(createArticleDto, file);
      return new ResponseData(article, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query() query : FindAllDto) {
    try {
      const article = await this.articleService.findAll(query);
      return new ResponseData(article, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const article = await this.articleService.findOne(+id);
      return new ResponseData(article, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 3000000 },
    fileFilter: (req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  })) 
  async update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto, @UploadedFile() file: Express.Multer.File) {
    try {
      const article = await this.articleService.update(+id, updateArticleDto, file);
      return new ResponseData(article, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const article = await this.articleService.remove(+id);
      return new ResponseData(article, HttpStatus.ACCEPTED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
