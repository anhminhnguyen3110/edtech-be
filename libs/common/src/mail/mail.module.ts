import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SES } from 'aws-sdk';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { ServerClient } from 'postmark';

import { ECommonConfig } from '../config/interfaces/config.interface';
import { EMailService } from '../constants/service.constant';
import { PostmarkService } from './external-services/postmark.service';
import { MailService } from './mail.service';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: EMailService.NODE_MAILER_SES,
            useFactory: (configService: ConfigService): Mail => {
                const ses = new SES({
                    region: configService.get(ECommonConfig.AWS_REGION),
                    accessKeyId: configService.get(ECommonConfig.AWS_ACCESS_KEY),
                    secretAccessKey: configService.get(ECommonConfig.AWS_SECRET_KEY),
                });

                const transporter: Mail = nodemailer.createTransport({
                    SES: ses,
                });

                return transporter;
            },
            inject: [ConfigService],
        },
        {
            provide: EMailService.POSTMARK_CLIENT,
            useFactory: (configService: ConfigService) => {
                return new ServerClient(configService.get(ECommonConfig.POSTMARK_SERVER_TOKEN));
            },
            inject: [ConfigService],
        },
        {
            provide: EMailService.MAIL_SERVICE,
            useClass: MailService,
        },
        {
            provide: EMailService.BASE_MAIL_SERVICE,
            useClass: PostmarkService,
        },
    ],
    exports: [EMailService.MAIL_SERVICE],
})
export class MailModule {}
