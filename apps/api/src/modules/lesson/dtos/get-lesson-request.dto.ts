import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetLessonRequestDto extends PartialType(PaginationRequestDto) {
    @ApiProperty({
        type: Number,
        example: 1,
        description: 'Class ID',
    })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    classAssignmentId: number;
}
