import { ConfigModule, ConfigService } from '@nestjs/config';

import { ECommonConfig } from '../config/interfaces/config.interface';

export function getBullConfig() {
    return {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService): Promise<any> => {
            return {
                redis: {
                    host: configService.get<string>(ECommonConfig.REDIS_HOST),
                    port: configService.get<number>(ECommonConfig.REDIS_PORT),
                    username: configService.get<string>(ECommonConfig.REDIS_USERNAME),
                    password: configService.get<string>(ECommonConfig.REDIS_PASSWORD),
                },
                useSharedConnection: true,
                enableReadyCheck: true,
                enableOfflineQueue: true,
                streams: {
                    enableStreams: true,
                    streamMaxLengthMaxMs: 5000,
                    streamLogger: {
                        level: 'debug',
                    },
                },
            };
        },
    };
}

export function getJobConfig() {
    return {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: true,
        removeOnFail: true,
    };
}
