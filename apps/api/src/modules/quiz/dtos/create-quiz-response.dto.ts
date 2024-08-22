import { ApiResponseProperty } from '@nestjs/swagger';

export class CreateQuizResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'My Quiz',
    })
    name: string;

    @ApiResponseProperty({
        type: String,
        example: 'This is a quiz about...',
    })
    description: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    classAssignmentId: number;
}

export class GenerateQuizResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Request to generate quiz has been sent. Please wait for the result.',
    })
    message: string;
}
