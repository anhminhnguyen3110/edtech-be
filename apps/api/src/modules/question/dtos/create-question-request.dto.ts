import { EQuestionType } from '@app/common/constants/table.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQuestionRequestDto {
    @ApiProperty({
        description: 'The text of the question',
        type: String,
        example: 'What is the capital of France?',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(500)
    questionText: string;

    @ApiProperty({
        description: 'The type of the question',
        type: 'enum',
        example: EQuestionType.MULTIPLE_CHOICE,
        enum: EQuestionType,
    })
    @IsEnum(EQuestionType)
    questionType: EQuestionType;

    @ApiPropertyOptional({
        description: 'The choices for the question',
        type: String,
        example: 'Paris\0London\0Berlin\0Madrid',
    })
    @IsOptional()
    @IsString({ each: true })
    @Transform(({ value }) => value.split('\0'))
    choices: string[];

    @ApiProperty({
        description: 'The correct answer to the question',
        type: String,
        example: 'Paris',
    })
    @IsNotEmpty()
    @IsString({ each: true })
    @Transform(({ value }) => value.split('\0'))
    correctAnswers: string[];

    @ApiProperty({
        description: 'The time limit in seconds for the question',
        example: 30,
        type: Number,
    })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    timeLimitInSecond: number;

    @ApiProperty({
        description: 'The ID of the quiz this question belongs to',
        example: 1,
        type: Number,
    })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    quizId: number;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        name: 'image',
    })
    @IsOptional()
    file: any;
}
