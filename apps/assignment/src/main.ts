import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ERabbitMQueue } from '@app/common/constants/queue.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import { CustomRpcExceptionFilter } from '@app/common/exception-filter/rpc-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AssignmentAppModule } from './assignment-app.module';
import { EConfig } from './config/interfaces/config.interface';

async function bootstrap() {
    const app = await NestFactory.create(AssignmentAppModule, {
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

    const httpPort = configService.get<number>(EConfig.ASSIGNMENT_HTTP_PORT);
    const _ = configService.get<number>(EConfig.ASSIGNMENT_PORT);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
            queue: ERabbitMQueue.ASSIGNMENT_APP_QUEUE,
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
