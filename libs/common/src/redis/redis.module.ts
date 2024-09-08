import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisOptions } from './redis.config';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [CacheModule.registerAsync(RedisOptions), ConfigModule],
    providers: [
        {
            provide: RedisService,
            useClass: RedisService,
        },
    ],
    exports: [RedisService],
})
export class RedisModule {}
