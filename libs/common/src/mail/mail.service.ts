import { Inject, Injectable } from '@nestjs/common';

import { ELoggerService, EMailService } from '../constants/service.constant';
import ILogger from '../logger/logger/interfaces/logger.interface';
import { MailAbstractClass } from './mail.abstract';

@Injectable()
export class MailService extends MailAbstractClass {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @Inject(EMailService.BASE_MAIL_SERVICE)
        private readonly mailService: MailAbstractClass,
    ) {
        super();
    }

    async sendMail(data: any): Promise<any> {
        return await this.mailService.sendMail(data);
    }
}
