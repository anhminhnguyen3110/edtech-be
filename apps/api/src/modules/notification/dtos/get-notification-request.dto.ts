import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class GetNotificationRequestDto extends PartialType(PaginationRequestDto) {}
