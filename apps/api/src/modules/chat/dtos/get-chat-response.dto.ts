import { EChatRole } from '@app/common/constants/chat.constant';
import { EChatFileType } from '@app/common/constants/table.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

export class GetChatTopicResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'Hello, how are you?',
    })
    topicName: string;

    @ApiResponseProperty({
        type: Date,
        example: '2021-09-10T07:00:00.000Z',
    })
    updatedAt: Date;
}

export class GetChatFileResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'file.jpg',
    })
    fileName: string;

    @ApiResponseProperty({
        type: String,
        example: 'https://www.example.com/file.pdf',
    })
    fileUrl: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EChatFileType,
        example: EChatFileType.PDF,
    })
    fileType: EChatFileType;
}

export class GetChatMessageResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'I am fine, thank you!',
    })
    message: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EChatRole,
        example: EChatRole.USER,
    })
    role: EChatRole;

    @ApiResponseProperty({
        type: Date,
        example: '2021-09-10T07:00:00.000Z',
    })
    updatedAt: Date;

    @ApiResponseProperty({
        type: GetChatFileResponseDto,
        example: {
            id: 1,
            fileName: 'file.jpg',
            fileUrl: 'https://www.example.com/file.pdf',
            fileFormat: 'pdf',
        },
    })
    file: GetChatFileResponseDto;

    @ApiResponseProperty({
        type: String,
        example: 'topic-name-example',
    })
    topicName: string;
}
