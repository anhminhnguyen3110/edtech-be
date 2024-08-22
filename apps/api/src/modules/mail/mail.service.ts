import { getJobConfig } from '@app/common/bull/bull.option';
import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import { EMailStatus, EMailType } from '@app/common/constants/table.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';

import { CreateAccountActivationMailRequestDto } from './dtos/create-mail-request.dto';
import { UpdateMailRequestDto } from './dtos/update-mail-request.dto';
import { MailEntity } from './models/mail.entity';
import { MailRepository } from './models/mail.repository';

@Injectable()
export class MailService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        private readonly mailRepo: MailRepository,
        @InjectQueue(EBullQueue.MAIL_QUEUE) private readonly mailQueue: Queue,
        private readonly configService: ConfigService,
    ) {}

    async sendActivationAccountMail(createMailRequestDto: CreateAccountActivationMailRequestDto) {
        this.logger.info('Sending mail', {
            prop: {
                createMailRequestDto,
            },
        });

        let mailEntity: MailEntity = new MailEntity();
        mailEntity.to = createMailRequestDto.to;
        mailEntity.status = EMailStatus.PENDING;
        mailEntity.from = this.configService.get(ECommonConfig.MAIL_ADMINISTRATOR);
        mailEntity.type = EMailType.ACCOUNT_ACTIVATION;

        mailEntity = await this.mailRepo.save(mailEntity);

        createMailRequestDto.mailId = mailEntity.id;

        await this.mailQueue.add(
            EBullQueueMessage.SEND_ACTIVATION_MAIL,
            createMailRequestDto,
            getJobConfig(),
        );

        return;
    }

    async updateMailInDb(data: { mail: UpdateMailRequestDto }) {
        const { mail } = data;

        const mailEntity: MailEntity = await this.mailRepo.findOne({
            where: {
                id: mail.id,
            },
        });

        if (!mailEntity) {
            return 'Mail not found';
        }

        Object.assign(mailEntity, mail);

        await this.mailRepo.save(mailEntity);

        return 'Success';
    }
}
