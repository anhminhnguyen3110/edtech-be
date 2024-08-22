import { ECommandMail } from '@app/common/constants/command.constant';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import {
    ELoggerService,
    EMailService,
    ERegisterMicroservice,
} from '@app/common/constants/service.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { MailAbstractClass } from '@app/common/mail/mail.abstract';
import {
    InjectQueue,
    OnQueueActive,
    OnQueueCompleted,
    OnQueueError,
    OnQueueFailed,
    OnQueueWaiting,
    Process,
    Processor,
} from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateAccountActivationMailRequestDto } from 'apps/api/src/modules/mail/dtos/create-mail-request.dto';
import { UpdateMailRequestDto } from 'apps/api/src/modules/mail/dtos/update-mail-request.dto';
import { Job, Queue } from 'bull';

@Processor(EBullQueue.MAIL_QUEUE)
export class MailHandleConsumer {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
        @Inject(EMailService.MAIL_SERVICE)
        private readonly mailService: MailAbstractClass,
        @InjectQueue(EBullQueue.MAIL_FAILED_QUEUE)
        private readonly failedQueue: Queue,
    ) {}

    @OnQueueActive()
    @Process({
        name: EBullQueueMessage.SEND_ACTIVATION_MAIL,
        concurrency: 3,
    })
    async onActive(job: Job, done: Function) {
        this.logger.info(`Processing job ${job.id} of type ${job.name}.`);
        const { data }: { data: CreateAccountActivationMailRequestDto } = job;
        let updateMailRequestDto: UpdateMailRequestDto;
        try {
            updateMailRequestDto = await this.mailService.sendMail(data);
        } catch (error) {
            done(error);
            return;
        }

        this.apiService.emit(ECommandMail.UPDATE_MAIL, {
            mail: updateMailRequestDto,
        });

        done();
    }

    @OnQueueCompleted()
    async onComplete(job: Job) {
        this.logger.info(`Job ${job.id} has completed.`);
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: any) {
        this.logger.error(`Job ${job.id} has failed with error: ${error.message}`);
        this.failedQueue.add(job.data);
    }

    @OnQueueError()
    async onError(error: Error) {
        this.logger.error(`ExtractIssueConsumer has error: ${error.message}`);
    }

    @OnQueueWaiting()
    async onWaiting(jobId: number) {
        this.logger.info(`ExtractIssueConsumer is waiting for job ${jobId}`);
    }
}
