import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ERabbitMQueue } from '@app/common/constants/queue.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import { CustomHttpExceptionFilter } from '@app/common/exception-filter/http-exception.filter';
import { RedisIoAdapter } from '@app/common/redis/redis-io.adapter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { ApiModule } from './api.module';
import { EConfig } from './config/interfaces/config.interface';
import { initSwagger } from './swagger';

async function bootstrap() {
    const app = await NestFactory.create(ApiModule, {
        bufferLogs: true,
    });

    const configService = app.get(ConfigService);

    app.useLogger(app.get(ELoggerService.LOGGER_ADAPTER));

    app.setGlobalPrefix(configService.get<string>(EConfig.API_PREFIX));

    app.useGlobalFilters(new CustomHttpExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );

    app.enableCors();

    if (configService.get<string>(EConfig.SWAGGER_PATH)) {
        initSwagger(app, configService.get<string>(EConfig.SWAGGER_PATH));
    }

    const port = configService.get<number>(EConfig.API_PORT);
    await app.listen(port);

    app.connectMicroservice({
        transport: Transport.RMQ,
        options: {
            urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
            queue: ERabbitMQueue.API_APP_QUEUE,
            queueOptions: {
                durable: true,
            },
        },
    });

    await app.startAllMicroservices();

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis(
        `redis://${configService.get<string>(ECommonConfig.REDIS_HOST)}:${configService.get<string>(
            ECommonConfig.REDIS_PORT,
        )}`,
    );

    if (redisIoAdapter.isConnected) {
        app.useWebSocketAdapter(redisIoAdapter);
    }

    app.useWebSocketAdapter(redisIoAdapter);

    app.get(ELoggerService.LOGGER_ADAPTER).debug(
        `${configService.get<string>(
            EConfig.APP_NAME,
        )} service is running on: ${await app.getUrl()}`,
    );
}
bootstrap();
