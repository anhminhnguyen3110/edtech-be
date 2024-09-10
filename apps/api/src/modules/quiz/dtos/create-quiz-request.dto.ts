import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

import { GetIssueResponseDto } from '../../issue/dtos/get-issue-response.dto';
import { CreateQuestionRequestDto } from '../../question/dtos/create-question-request.dto';

export class CreateQuizRequestDto {
    @ApiProperty({
        description: 'The name of the quiz',
        example: 'My Quiz',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        description: 'The description of the quiz',
        example: 'This is a quiz about...',
        type: String,
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    description?: string;

    @ApiPropertyOptional({
        description: 'The class assignment id of the quiz',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    classAssignmentId?: number;
}

export class GenerateQuizRequestDto {
    @ApiPropertyOptional({
        description: 'The class assignment id of the quiz',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    classAssignmentId?: number;

    @ApiProperty({
        description: 'The topic of the quiz',
        example: 'Mathematics',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    prompt = 'I want to generate content using issues of this class assignment';

    @ApiPropertyOptional({
        description: 'The number of multiple choice questions',
        example: 10,
        type: Number,
    })
    numberOfMultipleChoiceQuestions?: number = 10;

    @ApiPropertyOptional({
        description: 'The number of true false questions',
        example: 10,
        type: Number,
    })
    numberOfTrueFalseQuestions?: number = 10;

    @ApiPropertyOptional({
        description: 'The number of multiple answer questions',
        example: 10,
        type: Number,
    })
    numberOfMultipleAnswerQuestions?: number = 10;

    issues?: GetIssueResponseDto[];
    year?: string | null;
    accountId?: number;
    quiz?: CreateQuizRequestDto;
    questions?: CreateQuestionRequestDto[];
}
