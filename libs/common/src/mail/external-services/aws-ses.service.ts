import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ELoggerService, EMailService } from '@app/common/constants/service.constant';
import { EMailStatus } from '@app/common/constants/table.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAccountActivationMailRequestDto } from 'apps/api/src/modules/mail/dtos/create-mail-request.dto';
import { UpdateMailRequestDto } from 'apps/api/src/modules/mail/dtos/update-mail-request.dto';
import * as fs from 'fs';
import handlebars from 'handlebars';
import Mail from 'nodemailer/lib/mailer';
import * as path from 'path';

import { MailAbstractClass } from '../mail.abstract';
import { TConfirmEmailPayload } from '../type/mail.type';

export class AwsSesService extends MailAbstractClass {
    private readonly accountActivationSource: any;
    constructor(
        @Inject(EMailService.NODE_MAILER_SES) private readonly mailer: Mail,
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        private readonly configService: ConfigService,
    ) {
        super();
        this.accountActivationSource = fs.readFileSync(
            path.join(__dirname, '../../libs/common/mail/templates/account-activation.hbs'),
            'utf8',
        );
    }

    async sendMail(data: CreateAccountActivationMailRequestDto): Promise<UpdateMailRequestDto> {
        const { to, activationLink, userName, urlClient, mailId, expiredIn } = data;

        let expiredInText: string;

        switch (expiredIn) {
            case '1d':
                expiredInText = '24 hours';
                break;
            case '1w':
                expiredInText = '1 week';
                break;
            case '1m':
                expiredInText = '1 month';
                break;
            default:
                expiredInText = '1 day';
                break;
        }

        const template: HandlebarsTemplateDelegate<TConfirmEmailPayload> = handlebars.compile(
            this.accountActivationSource,
        );

        const html = template({
            userName: userName,
            activationLink: activationLink,
            expiredInText,
            clientUrl: urlClient,
        });

        const fromEmailAddress = this.configService.get<string>(ECommonConfig.MAIL_ADMINISTRATOR);

        const mailOptions: Mail.Options = {
            from: fromEmailAddress,
            to,
            subject: 'Account Activation',
            html,
        };

        const updateMail: UpdateMailRequestDto = {
            id: mailId,
            status: EMailStatus.SENT,
            subject: mailOptions.subject,
            body: mailOptions.html.toString(),
        };

        try {
            await this.mailer.sendMail(mailOptions);
        } catch (error) {
            this.logger.error(error);
            updateMail.status = EMailStatus.FAILED;
        }

        return updateMail;
    }
}
