import { ERole } from '@app/common/constants/role.constant';
import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class GetAccountRequestDto extends PaginationRequestDto {
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Filter by email address',
        type: String,
    })
    email?: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Filter by account holder name',
        type: String,
    })
    name?: string;

    @IsOptional()
    @IsEnum(ERole)
    @ApiPropertyOptional({
        description: 'Filter by account role',
        example: ERole.TEACHER,
        enum: ERole,
    })
    role?: ERole = ERole.TEACHER;
}
