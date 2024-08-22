import { ApiResponseProperty } from '@nestjs/swagger';

export class DeleteChatResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Topic deleted successfully',
    })
    message: string;
}
