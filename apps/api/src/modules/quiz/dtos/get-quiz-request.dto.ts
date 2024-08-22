import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GetQuizRequestDto extends PaginationRequestDto {
    @ApiPropertyOptional({
        description: 'Search by quiz name',
        type: String,
        example: 'My Quiz',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by class assignment id',
        type: Number,
        example: 1,
    })
    @IsOptional()
    classAssignmentId?: number;

    accountId?: number;
}

export class GetQuizDetailRequestDto {}
