import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetGameRequestDto extends PartialType(PaginationRequestDto) {
    @ApiPropertyOptional({
        description: 'The id of the quiz to be played',
        type: Number,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    quizId?: number;

    @ApiPropertyOptional({
        description: 'Search quiz name',
        type: String,
        example: 'Quiz1',
    })
    @IsOptional()
    @IsString()
    quizNameSearch?: string;
}
