import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationRepository } from './models/notification.repository';
import { NotificationController } from './notification.controller';
import { NotificationEventController } from './notification.event';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';

@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [NotificationController, NotificationEventController],
    providers: [NotificationService, NotificationRepository, NotificationGateway],
    exports: [NotificationService],
})
export class NotificationModule {}
