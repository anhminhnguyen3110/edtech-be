import { ApiResponseProperty } from '@nestjs/swagger';

export class DeleteLessonResponseDto {
    @ApiResponseProperty({
        type: 'string',
        example: 'Lesson deleted successfully',
    })
    message: string;
}
