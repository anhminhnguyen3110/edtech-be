import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

import { ECommonConfig } from '../config/interfaces/config.interface';

export const RedisOptions: CacheModuleAsyncOptions = {
    isGlobal: true,
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
            socket: {
                host: configService.get<string>(ECommonConfig.REDIS_HOST),
                port: configService.get<number>(ECommonConfig.REDIS_PORT),
            },
            username: configService.get<string>(ECommonConfig.REDIS_USERNAME),
            password: configService.get<string>(ECommonConfig.REDIS_PASSWORD),
            ttl: configService.get<number>(ECommonConfig.REDIS_TTL),
        });
        return {
            store: () => store,
        };
    },
    inject: [ConfigService],
};
