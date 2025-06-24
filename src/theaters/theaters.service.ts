import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class TheatersService {
  constructor(private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  async create(createTheaterDto: CreateTheaterDto, logoFile?: Express.Multer.File) {
    try {
      const latitude = createTheaterDto.latitude ? parseFloat(String(createTheaterDto.latitude)) : 0;
      const longitude = createTheaterDto.longitude ? parseFloat(String(createTheaterDto.longitude)) : 0;
      
      // Tạo theater trong database
      const theater = await this.prisma.theater.create({
        data: {
          name: createTheaterDto.name,
          location: createTheaterDto.location,
          logo: createTheaterDto.logo || '',
          latitude: latitude,
          longitude: longitude,
        },
      });
      
      if (logoFile) {
        try {
          const logo = await this.cloudinaryService.uploadImage(logoFile);
          if (logo) {
            const updatedTheater = await this.prisma.theater.update({
              where: { id: theater.id },
              data: { logo: logo.secure_url },
            });
            return updatedTheater;
          }
        } catch (uploadError) {
          throw new BadRequestException(`Failed to upload logo: ${uploadError.message}`);
        }
      }

      return theater;
    } catch (error) {
      throw new BadRequestException(`Failed to create theater: ${error.message}`);
    }
  }

  findAll() {
    return `This action returns all theaters`;
  }

  findOne(id: number) {
    return `This action returns a #${id} theater`;
  }

  update(id: number, updateTheaterDto: UpdateTheaterDto) {
    return `This action updates a #${id} theater`;
  }

  remove(id: number) {
    return `This action removes a #${id} theater`;
  }
}
