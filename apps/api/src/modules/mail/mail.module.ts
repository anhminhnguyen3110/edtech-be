import { getBullConfig } from '@app/common/bull/bull.option';
import { EBullQueue } from '@app/common/constants/queue.constant';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { MailController } from './mail.controller';
import { MailEvent } from './mail.event';
import { MailService } from './mail.service';
import { MailRepository } from './models/mail.repository';

@Module({
    imports: [
        BullModule.forRootAsync(getBullConfig()),
        BullModule.registerQueue({
            name: EBullQueue.MAIL_QUEUE,
        }),
    ],
    controllers: [MailController, MailEvent],
    providers: [MailService, MailRepository],
    exports: [MailService],
})
export class MailModule {}
