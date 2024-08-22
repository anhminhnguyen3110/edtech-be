import { ApiResponseProperty } from '@nestjs/swagger';

export class UpdateChatResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Chat updated successfully',
    })
    message: string;

    @ApiResponseProperty({
        type: Number,
        example: '1',
    })
    chatTopicId: number;

    @ApiResponseProperty({
        type: String,
        example: 'Chat topic name',
    })
    chatTopicName: string;
}
