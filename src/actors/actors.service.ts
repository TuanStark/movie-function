import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class ActorsService {

  constructor(private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  async create(CreateActorDto: CreateActorDto, photoFile?: Express.Multer.File) {
    try {
      
      const actor = await this.prisma.actor.create({
        data: {
          name: CreateActorDto.name,
          photo: "image.png"
        },
      });
      
      if (photoFile) {
        try {
          const logo = await this.cloudinaryService.uploadImage(photoFile);
          if (logo) {
            const updatedActor = await this.prisma.actor.update({
              where: { id: actor.id },
              data: { photo: logo.secure_url },
            });
            return updatedActor;
          }
        } catch (uploadError) {
          throw new BadRequestException(`Failed to upload photo: ${uploadError.message}`);
        }
      }

      return actor;
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
        ]
      }
      : {};
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [actors, total] = await Promise.all([
      this.prisma.actor.findMany({
        where: where,
        orderBy: orderBy,
        skip,
        take,
      }),
      this.prisma.actor.count({
        where: where,
      })
    ])

    return {
      data: actors,
      meta: {
        total,
        pageNumber,
        limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findOne(id: number) {
    const existingActor = await this.prisma.actor.findUnique({
      where: { id: id },
    });

    if(!existingActor){
      throw new NotFoundException(`Actor with id ${id} not found`);
    }

    return existingActor;
  }

  async update(id: number, updateActorDto: UpdateActorDto, photoFile?: Express.Multer.File) {
    try {
      const actor = await this.prisma.actor.findUnique({
        where: { id: id },
      });
  
      if (!actor) {
        throw new NotFoundException('Actor not found');
      }
  
      const existingActor = await this.prisma.actor.update({
        where: { id: actor.id },
        data: {
          name: updateActorDto.name,
          photo: updateActorDto.photo,
        },
      });
  
      if (photoFile) {
        try {
          const logo = await this.cloudinaryService.updateImage(photoFile, existingActor.photo);
          if (logo) {
            const updatedActor = await this.prisma.actor.update({
              where: { id: existingActor.id },
              data: { photo: logo.secure_url },
            });
            return updatedActor;
          }
        } catch (uploadError) {
          throw new BadRequestException(`Failed to upload logo: ${uploadError.message}`);
        }
      }
  
      return existingActor;
    } catch (error) {
      throw new BadRequestException(`Failed to update actor: ${error.message}`);
    }
  }

  async remove(id: number) {
    const existingActor = await this.prisma.actor.findUnique({
      where: { id: id },
    });

    if(!existingActor){
      throw new NotFoundException(`Actor with id ${id} not found`);
    }

    await this.prisma.actor.delete({
      where: { id: id },
    });

    return { message: `Actor with id ${id} deleted successfully` };
  }
}
