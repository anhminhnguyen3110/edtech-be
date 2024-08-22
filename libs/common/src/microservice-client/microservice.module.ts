import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, ClientsModuleAsyncOptions, Transport } from '@nestjs/microservices';

import { CommonConfigModule } from '../config/config.module';
import { ECommonConfig } from '../config/interfaces/config.interface';
import { ERabbitMQueue } from '../constants/queue.constant';
import { ERegisterMicroservice } from '../constants/service.constant';

const microserviceProviders: ClientsModuleAsyncOptions = [
    {
        name: ERegisterMicroservice.API_SERVICE_RABBIT_MQ,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
                urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
                queue: ERabbitMQueue.API_APP_QUEUE,
            },
        }),
    },
    {
        name: ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
                urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
                queue: ERabbitMQueue.ASSIGNMENT_APP_QUEUE,
            },
        }),
    },
    {
        name: ERegisterMicroservice.QUIZ_SERVICE_RABBIT_MQ,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
                urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
                queue: ERabbitMQueue.QUIZ_QUEUE,
            },
        }),
    },
    {
        name: ERegisterMicroservice.BACKGROUND_JOB_SERVICE_RABBIT_MQ,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
                urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
                queue: ERabbitMQueue.BACKGROUND_JOB_QUEUE,
            },
        }),
    },
    {
        name: ERegisterMicroservice.CHAT_SERVICE_RABBIT_MQ,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
                urls: [configService.get<string>(ECommonConfig.RABBIT_MQ_URL)],
                queue: ERabbitMQueue.CHAT_QUEUE,
            },
        }),
    },
];

@Global()
@Module({
    imports: [CommonConfigModule, ClientsModule.registerAsync(microserviceProviders)],
    exports: [ClientsModule],
})
export class GlobalMicroserviceModule {}
