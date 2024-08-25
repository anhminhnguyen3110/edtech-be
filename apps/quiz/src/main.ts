import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ERabbitMQueue } from '@app/common/constants/queue.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import { CustomRpcExceptionFilter } from '@app/common/exception-filter/rpc-exception.filter';
import { RedisIoAdapter } from '@app/common/redis/redis-io.adapter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { EConfig } from './config/interfaces/config.interface';
import { QuizAppModule } from './quiz-app.module';

async function bootstrap() {
    const app = await NestFactory.create(QuizAppModule, {
        bufferLogs: true,
    });

    const configService = app.get(ConfigService);

    app.useLogger(app.get(ELoggerService.LOGGER_ADAPTER));

    app.useGlobalFilters(new CustomRpcExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );

    const httpPort = configService.get<number>(EConfig.QUIZ_HTTP_PORT);
    const _ = configService.get<number>(EConfig.QUIZ_PORT);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
            queue: ERabbitMQueue.QUIZ_QUEUE,
            queueOptions: {
                durable: true,
            },
        },
    });

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis(
        `redis://${configService.get<string>(ECommonConfig.REDIS_HOST)}:${configService.get<string>(
            ECommonConfig.REDIS_PORT,
        )}`,
    );

    if (redisIoAdapter.isConnected) {
        app.useWebSocketAdapter(redisIoAdapter);
    }

    await app.startAllMicroservices();
    await app.listen(httpPort);

    app.get(ELoggerService.LOGGER_ADAPTER).debug(
        `Quiz service is running on: ${await app.getUrl()}`,
    );
}
bootstrap();
