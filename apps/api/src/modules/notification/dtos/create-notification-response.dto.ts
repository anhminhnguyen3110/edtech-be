import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

export class CreateNotificationResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: 'New message',
    })
    message: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    classAssignmentId: number;

    @ApiResponseProperty({
        type: Boolean,
        example: false,
    })
    isRead: boolean;

    @ApiResponseProperty({
        type: Date,
        example: '2021-09-15T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiResponseProperty({
        type: Date,
        example: '2021-09-15T00:00:00.000Z',
    })
    updatedAt: Date;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    accountId: number;

    @ApiResponseProperty({
        type: 'enum',
        enum: ENotificationEventType,
        example: ENotificationEventType.EXTRACT_ISSUE_SUCCESS,
    })
    eventType: ENotificationEventType;
}
