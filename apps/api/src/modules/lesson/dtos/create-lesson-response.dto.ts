import { ApiResponseProperty } from '@nestjs/swagger';

export class GenerateLessonResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Request send successfully. Please wait for the finish',
    })
    message: string;
}
