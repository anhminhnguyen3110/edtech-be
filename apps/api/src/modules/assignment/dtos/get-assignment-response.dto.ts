import { EYear } from '@app/common/constants/table.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

import { GetClassResponseDto } from '../../class/dtos/get-class-response.dto';

export class GetAssignmentResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'Math Assignment',
    })
    name: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EYear,
        example: EYear.YEAR_4,
    })
    year: EYear;
}

export class GetCriteriaLevelResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'Always',
    })
    name: string;

    @ApiResponseProperty({
        type: Number,
        example: 3,
    })
    score: number;
}

export class GetCriteriaResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: "Show, don't tell",
    })
    description: string;

    @ApiResponseProperty({
        type: [GetCriteriaLevelResponseDto],
        example: [
            {
                id: 1,
                name: 'Always',
                score: 3,
            },
            {
                id: 2,
                name: 'Sometimes',
                score: 2,
            },
            {
                id: 3,
                name: 'Never',
                score: 1,
            },
        ],
    })
    criteriaLevels: GetCriteriaLevelResponseDto[];
}

export class GetAssignmentDetailResponseDto extends GetAssignmentResponseDto {
    @ApiResponseProperty({
        type: [GetClassResponseDto],
        example: [
            {
                id: 1,
                name: 'Class 1B',
                subject: 'English',
                year: EYear.YEAR_4,
                classAssignmentId: 1,
            },
        ],
    })
    classes: GetClassResponseDto[];

    @ApiResponseProperty({
        type: [GetCriteriaResponseDto],
        example: [
            {
                id: 1,
                description: "Show, don't tell",
                criteriaLevels: [
                    {
                        id: 1,
                        name: 'Always',
                        score: 3,
                    },
                    {
                        id: 2,
                        name: 'Sometimes',
                        score: 2,
                    },
                    {
                        id: 3,
                        name: 'Never',
                        score: 1,
                    },
                ],
            },
        ],
    })
    criteria: GetCriteriaResponseDto[];
}
