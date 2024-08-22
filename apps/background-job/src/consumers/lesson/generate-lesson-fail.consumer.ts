import { EBullQueue } from '@app/common/constants/queue.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import {
    OnQueueCompleted,
    OnQueueError,
    OnQueueFailed,
    OnQueueWaiting,
    Processor,
} from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';

@Processor(EBullQueue.GENERATE_LESSON_FAILED_QUEUE)
export class GenerateLessonFailedConsumer {
    constructor(@Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger) {}

    @OnQueueCompleted()
    async onComplete(job: Job, result: any) {
        this.logger.info(`Job ${job.id} has completed. Result: ${JSON.stringify(result)}`);
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: any) {
        this.logger.error(`Job ${job.id} has failed with error: ${error.message}`);
    }

    @OnQueueError()
    async onError(error: Error) {
        this.logger.error(`Generate lesson has error: ${error.message}`);
    }

    @OnQueueWaiting()
    async onWaiting(jobId: number) {
        this.logger.info(`Generate lesson is waiting for job ${jobId}`);
    }
}
