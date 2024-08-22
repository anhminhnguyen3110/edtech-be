import { ApiResponseProperty } from '@nestjs/swagger';

export class CreateIssueResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'Homework not submitted',
    })
    name: string;

    @ApiResponseProperty({
        type: Number,
        example: 5,
    })
    studentCount: number;

    @ApiResponseProperty({
        type: String,
        example: '75%',
    })
    studentRate: string;

    @ApiResponseProperty({
        type: String,
        example: 'Homework not submitted',
    })
    description: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    classAssignmentId?: number;
}

export class ExtractIssuesResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Success',
    })
    message: string;
}
