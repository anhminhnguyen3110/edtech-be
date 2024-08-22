import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ERabbitMQueue } from '@app/common/constants/queue.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { BackgroundJobModule } from './background-job.module';
import { EConfig } from './config/interfaces/config.interface';

async function bootstrap() {
    const app = await NestFactory.create(BackgroundJobModule, {
        bufferLogs: true,
    });

    const configService = app.get(ConfigService);

    app.useLogger(app.get(ELoggerService.LOGGER_ADAPTER));

    const httpPort = configService.get<number>(EConfig.BACKGROUND_JOB_HTTP_PORT);
    const _ = configService.get<number>(EConfig.BACKGROUND_JOB_PORT);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
            queue: ERabbitMQueue.BACKGROUND_JOB_QUEUE,
            queueOptions: {
                durable: true,
            },
        },
    });

    await app.startAllMicroservices();
    await app.listen(httpPort);

    app.get(ELoggerService.LOGGER_ADAPTER).debug(
        `${configService.get<string>(
            EConfig.APP_NAME,
        )} service is running on: ${await app.getUrl()}`,
    );
}
bootstrap();
