import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountEntity } from './models/account.entity';
import { AccountRepository } from './models/account.repository';

@Module({
    imports: [NotificationModule, MailModule, forwardRef(() => AuthModule)],
    controllers: [AccountController],
    providers: [AccountService, AccountRepository, AccountEntity],
    exports: [AccountService],
})
export class AccountModule {}
