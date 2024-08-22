import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { GetIssueResponseDto } from '../../issue/dtos/get-issue-response.dto';

export class GenerateLessonRequestDto {
    @ApiProperty({
        description: 'The title of the lesson to generate',
        example: 'Lesson 1',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The ID of the class assignment to generate',
        example: 1,
        type: Number,
    })
    @IsNotEmpty()
    @IsInt()
    classAssignmentId: number;

    @ApiProperty({
        description: 'The prompt for the lesson to generate',
        example: 'I want a lesson that is hilarious',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    prompt: string;

    issues?: GetIssueResponseDto[];
    year?: string | null;
    accountId?: number;
}

export class IntroductionLessonDto {
    objectives: string[];
    overview: string;
}

export class Point {
    'Brief Description': string;
    Examples: string;
    Impacts: string;
    Causes?: string[];
    Symptoms?: string[];
    Consequences?: string[];
    Solution?: string;
    Benefits?: string[];
}

export class IssueLessonDto {
    issue: string;
    description: string;
    content: {
        title: string;
        points: Point[];
    }[];
}

export class ConclusionLessonDto {
    summary: string;
    takeaways: string[];
}

export class LessonContentDto {
    introduction: IntroductionLessonDto;
    issues: IssueLessonDto[];
    conclusion: ConclusionLessonDto;
}
