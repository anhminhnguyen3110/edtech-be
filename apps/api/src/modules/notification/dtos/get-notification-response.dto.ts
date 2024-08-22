import { ApiResponseProperty } from '@nestjs/swagger';

import { CreateNotificationResponseDto } from './create-notification-response.dto';

export class GetNotificationResponseDto extends CreateNotificationResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    numberOfUnreadNotifications: number;
}
