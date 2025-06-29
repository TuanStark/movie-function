import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from 'src/global/find-all.dto';

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService){}

  async create(createGenreDto: CreateGenreDto) {
    try {
      const genre = await this.prisma.genre.create({
        data : {
          name: createGenreDto.name
        }
      })
      return genre;
    } catch (error) {
      throw new BadRequestException(`Failed to upload logo: ${error.message}`);
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

    const [genres, total] = await Promise.all([
      this.prisma.genre.findMany({
        where: where,
        orderBy: orderBy,
        skip,
        take,
      }),
      this.prisma.theater.count({
        where: where,
      })
    ])

    return {
      data: genres,
      meta: {
        total,
        pageNumber,
        limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findOne(id: number) {
    return await this.prisma.genre.findUnique({
      where:{id : id}
    });
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    try {
      const existingGenres = this.findOne(id);

      if(!existingGenres){
        throw new BadRequestException('Failed to find genres');
      }

      const updateGenres = await this.prisma.genre.update({
        where: {id : id},
        data: {
          name : updateGenreDto.name
        }
      });
      return updateGenres;
    } catch (error) {
      throw new BadRequestException('Failed to update genres');
    }
  }

  async remove(id: number) {
    return await this.prisma.genre.delete({
      where : {id : id}
    }) ;
  }
}
