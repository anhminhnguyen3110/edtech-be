import { ApiResponseProperty } from '@nestjs/swagger';

export class DeleteQuizResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Quiz deleted successfully',
    })
    message: string;
}
