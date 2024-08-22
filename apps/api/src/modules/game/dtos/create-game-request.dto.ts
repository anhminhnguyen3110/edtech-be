import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateGameRequestDto {
    @ApiProperty({
        description: 'The id of the quiz to be played',
        example: 1,
        type: Number,
        required: true,
    })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    quizId: number;
}
