import { ApiResponseProperty } from '@nestjs/swagger';

export class GetLessonResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'Lesson Name',
    })
    name: string;

    @ApiResponseProperty({
        type: String,
        example: 'https://example.com/download',
    })
    fileUrl: string;

    @ApiResponseProperty({
        type: Date,
        example: new Date(),
    })
    createdAt: Date;
}
