import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieCastDto } from './create-movie-cast.dto';

export class UpdateMovieCastDto extends PartialType(CreateMovieCastDto) {}
