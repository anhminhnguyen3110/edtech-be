import { EYear } from '@app/common/constants/table.constant';
import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetAssignmentRequestDto extends PartialType(PaginationRequestDto) {
    @ApiProperty({
        description: 'Name of the assignment',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Year of the assignment',
        enum: EYear,
        required: false,
    })
    @IsOptional()
    @IsEnum(EYear)
    year?: EYear;
}
