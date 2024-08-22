import { ApiProperty } from '@nestjs/swagger';

export class GetQuestionRequestDto {
    @ApiProperty({
        type: Number,
        example: 1,
        description: 'The ID of the quiz this question belongs to',
    })
    quizId: number;
}
