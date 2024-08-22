import { getBullConfig } from '@app/common/bull/bull.option';
import { CommonConfigModule } from '@app/common/config/config.module';
import { EBullQueue } from '@app/common/constants/queue.constant';
import { LanguageModelModule } from '@app/common/language-model/language-model.module';
import { LoggerModule } from '@app/common/logger/logger/logger.module';
import { MailModule } from '@app/common/mail/mail.module';
import { GlobalMicroserviceModule } from '@app/common/microservice-client/microservice.module';
import { prometheusModule } from '@app/common/prometheus/prometheus.config';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EConfig } from 'apps/api/src/config/interfaces/config.interface';

import { BackgroundJobService } from './background-job.service';
import { configuration, validationSchema } from './config/validate/config.validate';
import { ExtractCommonIssueConsumer } from './consumers/extract-issue/extract-common-issue.consumer';
import { ExtractIssueFailedConsumer } from './consumers/extract-issue/extract-issue-fail.consumer';
import { ExtractIssueConsumer } from './consumers/extract-issue/extract-issue.consumer';
import { GenerateLessonFailedConsumer } from './consumers/lesson/generate-lesson-fail.consumer';
import { GenerateLessonConsumer } from './consumers/lesson/generate-lesson.consumer';
import { MailFailHandleConsumer } from './consumers/mail/mail-fail.consumer';
import { MailHandleConsumer } from './consumers/mail/mail.consumer';
import { GenerateQuizConsumer } from './consumers/quiz/generate-quiz.consumer';

@Module({
    imports: [
        MailModule,
        CommonConfigModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['apps/background-job/.env'],
            load: [configuration],
            validationSchema: validationSchema,
        }),
        LanguageModelModule,
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return configService.get<string>(EConfig.APP_NAME);
            },
        }),
        BullModule.forRootAsync(getBullConfig()),
        BullModule.registerQueue(
            {
                name: EBullQueue.EXTRACT_ISSUE_QUEUE,
            },
            {
                name: EBullQueue.MAIL_QUEUE,
            },
            {
                name: EBullQueue.EXTRACT_ISSUE_FAILED_QUEUE,
            },
            {
                name: EBullQueue.MAIL_FAILED_QUEUE,
            },
            {
                name: EBullQueue.GENERATE_LESSON_QUEUE,
            },
            {
                name: EBullQueue.GENERATE_LESSON_FAILED_QUEUE,
            },
            {
                name: EBullQueue.GENERATE_QUIZ_QUEUE,
            },
            {
                name: EBullQueue.GENERATE_QUIZ_FAILED_QUEUE,
            },
        ),
        GlobalMicroserviceModule,
        prometheusModule('/metrics', 'background-job'),
    ],
    providers: [
        BackgroundJobService,
        ExtractIssueConsumer,
        ExtractCommonIssueConsumer,
        ExtractIssueFailedConsumer,
        MailHandleConsumer,
        MailFailHandleConsumer,
        GenerateLessonConsumer,
        GenerateLessonFailedConsumer,
        GenerateQuizConsumer,
    ],
})
export class BackgroundJobModule {}
