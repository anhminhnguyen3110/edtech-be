import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetGameRequestDto extends PartialType(PaginationRequestDto) {
    @ApiProperty({
        description: 'The id of the quiz to be played',
        example: 1,
        type: Number,
        required: true,
    })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    quizId: number;
}
