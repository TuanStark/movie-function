import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FindAllDto } from 'src/global/find-all.dto';

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
          { location: { contains: searchUpCase } },
        ]
      }
      : {};
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [theaters, total] = await Promise.all([
      this.prisma.theater.findMany({
        where: where,
        orderBy: orderBy,
        skip,
        take,
        include: {
          showtimes: {
            include: {
              movie: true,
            }
          }
        }
      }),
      this.prisma.theater.count({
        where: where,
      })
    ])

    return {
      data: theaters,
      meta: {
        total,
        pageNumber,
        limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  findOne(id: number) {
    return this.prisma.theater.findUnique({
      where: { id: id },
      include: {
        showtimes: {
          include: {
            movie: true,
          }
        }
      }
    });
  }

  async update(id: number, updateTheaterDto: UpdateTheaterDto, logoFile?: Express.Multer.File) {
    try {
      const theater = await this.prisma.theater.findUnique({
        where: { id: id },
      });
  
      if (!theater) {
        throw new NotFoundException('Theater not found');
      }
  
      const latitude = updateTheaterDto.latitude ? parseFloat(String(updateTheaterDto.latitude)) : theater.latitude;
      const longitude = updateTheaterDto.longitude ? parseFloat(String(updateTheaterDto.longitude)) : theater.longitude;
  
      const existingTheater = await this.prisma.theater.update({
        where: { id: theater.id },
        data: {
          name: updateTheaterDto.name,
          location: updateTheaterDto.location,
          latitude: latitude,
          longitude: longitude,
        },
      });
  
      if (logoFile) {
        try {
          const logo = await this.cloudinaryService.updateImage(logoFile, existingTheater.logo);
          if (logo) {
            const updatedTheater = await this.prisma.theater.update({
              where: { id: existingTheater.id },
              data: { logo: logo.secure_url },
            });
            return updatedTheater;
          }
        } catch (uploadError) {
          throw new BadRequestException(`Failed to upload logo: ${uploadError.message}`);
        }
      }
  
      return existingTheater;
    } catch (error) {
      throw new BadRequestException(`Failed to update theater: ${error.message}`);
    }
  }

  async remove(id: number) {
    const theater = await this.prisma.theater.findUnique({
      where: { id: id },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }
  }
}
