import { PartialType } from '@nestjs/mapped-types';
import { CreateShowTimeDto } from './create-show-time.dto';

export class UpdateShowTimeDto extends PartialType(CreateShowTimeDto) {}
