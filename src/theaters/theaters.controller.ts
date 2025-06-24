import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, HttpStatus, HttpException } from '@nestjs/common';
import { TheatersService } from './theaters.service';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { ResponseData } from 'src/global/globalClass';
import { HttpMessage } from 'src/global/globalEnum';

@Controller('theaters')
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

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
  findAll() {
    return this.theatersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.theatersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTheaterDto: UpdateTheaterDto) {
    return this.theatersService.update(+id, updateTheaterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.theatersService.remove(+id);
  }
}
