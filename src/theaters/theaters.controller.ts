import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, HttpStatus, HttpException, Query, UseGuards } from '@nestjs/common';
import { TheatersService } from './theaters.service';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from 'src/global/globalEnum';
import { FindAllDto } from 'src/global/find-all.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/role.decorator';

@Controller('theaters')
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 1000000 },
    fileFilter: (req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  })) 
  async create(@Body() createTheaterDto: CreateTheaterDto, @UploadedFile() file: Express.Multer.File) {
    try {      
      const theater = await this.theatersService.create(createTheaterDto, file);
      return new ResponseData(theater, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query() query: FindAllDto) {
    try {
      const theaters = await this.theatersService.findAll(query);
      return new ResponseData(theaters, HttpStatus.OK, HttpMessage.SUCCESS);
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
      const theater = await this.theatersService.findOne(+id);
      return new ResponseData(theater, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 1000000 },
    fileFilter: (req, file, cb) => {
      if (!file || !file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  })) 
  async update(@Param('id') id: string, @Body() updateTheaterDto: UpdateTheaterDto, @UploadedFile() file: Express.Multer.File) {
    console.log("hello");
    try {
      const theater = await this.theatersService.update(+id, updateTheaterDto, file);
      return new ResponseData(theater, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const theater = await this.theatersService.remove(+id);
      return new ResponseData(theater, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(
        new ResponseData(null, HttpStatus.BAD_REQUEST, error.message || HttpMessage.INVALID_INPUT_FORMAT),
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
