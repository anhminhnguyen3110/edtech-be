import { EYear } from '@app/common/constants/table.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

import { GetIssueResponseDto } from '../../issue/dtos/get-issue-response.dto';
import { GetLessonResponseDto } from '../../lesson/dtos/get-lesson-response.dto';

export class GetClassResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'Class 1B',
    })
    name: string;

    @ApiResponseProperty({
        type: String,
        example: 'English',
    })
    subject: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EYear,
        example: EYear.YEAR_4,
    })
    year: EYear;

    @ApiResponseProperty({
        type: Number,
        example: 30,
    })
    classAssignmentId: number;
}

export class GetClassDetailResponseDto extends GetClassResponseDto {
    @ApiResponseProperty({
        type: [GetLessonResponseDto],
        example: [
            {
                id: 1,
                name: 'Lesson 1',
                createdAt: new Date(),
            },
            {
                id: 2,
                name: 'Lesson 2',
                createdAt: new Date(),
            },
        ],
    })
    lessons: GetLessonResponseDto[];

    @ApiResponseProperty({
        type: [GetIssueResponseDto],
        example: [
            {
                id: 1,
                name: 'Homework not submitted',
                studentCount: 5,
                studentRate: '75%',
            },
            {
                id: 2,
                name: 'Homework not submitted',
                studentCount: 5,
                studentRate: '75%',
            },
        ],
    })
    issues: GetIssueResponseDto[];

    @ApiResponseProperty({
        type: Number,
        example: 100,
    })
    totalAssessment: number;
}
