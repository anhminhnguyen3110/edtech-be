import { EQuestionType } from '@app/common/constants/table.constant';
import { ApiResponseProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateQuestionResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'What is the capital of France?',
    })
    questionText: string;

    @ApiResponseProperty({
        type: Number,
        example: 30,
    })
    timeLimitInSecond: number;

    @ApiResponseProperty({
        type: 'enum',
        enum: EQuestionType,
        example: EQuestionType.MULTIPLE_CHOICE,
    })
    questionType: EQuestionType;

    @ApiResponseProperty({
        type: [String],
        example: ['Paris', 'London', 'Berlin', 'Madrid'],
    })
    @Transform(({ value }) => JSON.parse(value))
    choices: string[];

    @ApiResponseProperty({
        type: [String],
        example: ['Paris'],
    })
    correctAnswers: string[];

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    quizId: number;

    @ApiResponseProperty({
        type: String,
        example: 'https://s3.amazonaws.com/bucket-name/file-name.jpg',
    })
    imageFileUrl: string;
}
