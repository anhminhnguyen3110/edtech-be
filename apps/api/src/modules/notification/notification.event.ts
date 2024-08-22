import { ECommandNotification } from '@app/common/constants/command.constant';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { CreateNotificationRequestDto } from './dtos/create-notification-request.dto';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationEventController {
    constructor(private readonly notificationService: NotificationService) {}

    @EventPattern(ECommandNotification.CREATE_NOTIFICATION)
    async createNotification(
        @Payload()
        data: {
            createNotificationRequestDto: CreateNotificationRequestDto;
            accountId: number;
        },
    ) {
        this.notificationService.createNotification(
            data.createNotificationRequestDto,
            data.accountId,
        );
    }
}
