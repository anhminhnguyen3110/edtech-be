import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisOptions } from './redis.config';
import { RedisController } from './redis.controller';
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
    controllers: [RedisController],
    exports: [RedisService],
})
export class RedisModule {}
