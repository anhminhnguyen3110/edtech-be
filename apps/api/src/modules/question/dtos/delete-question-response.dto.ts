import { ApiResponseProperty } from '@nestjs/swagger';

export class DeleteQuestionResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Question deleted successfully',
    })
    message: string;
}
