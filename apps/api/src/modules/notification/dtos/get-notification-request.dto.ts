import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { PartialType } from '@nestjs/swagger';

export class GetNotificationRequestDto extends PartialType(PaginationRequestDto) {}
