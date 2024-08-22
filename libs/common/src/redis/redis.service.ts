import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { Lock } from 'redlock';

import { ECommonConfig } from '../config/interfaces/config.interface';
import { ELoggerService } from '../constants/service.constant';
import ILogger from '../logger/logger/interfaces/logger.interface';

@Injectable()
export class RedisService {
    private redlock: Redlock;
    private redisClient: Redis;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @Inject(ELoggerService.LOGGER_KEY) private logger: ILogger,
        private readonly configService: ConfigService,
    ) {
        this.redisClient = new Redis({
            host: this.configService.get<string>(ECommonConfig.REDIS_HOST),
            port: this.configService.get<number>(ECommonConfig.REDIS_PORT),
            username: this.configService.get<string>(ECommonConfig.REDIS_USERNAME),
            password: this.configService.get<string>(ECommonConfig.REDIS_PASSWORD),
        });

        this.redlock = new Redlock([this.redisClient], {
            retryCount: 10,
            retryDelay: 3000, // time in ms
        });
    }

    async get(key: string): Promise<any> {
        try {
            return await this.cacheManager.get(key);
        } catch (error) {
            this.logger.error(`Error getting key ${key} from Redis`, error);
            throw error;
        }
    }

    async set(key: string, value: any, ttlInSeconds = 600): Promise<void> {
        try {
            await this.cacheManager.set(key, value, ttlInSeconds * 1000);
        } catch (error) {
            this.logger.error(`Error setting key ${key} to Redis`, error);
            throw error;
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.cacheManager.del(key);
        } catch (error) {
            this.logger.error(`Error deleting key ${key} from Redis`, error);
            throw error;
        }
    }

    async delPatternSpecific(prefix: string): Promise<void> {
        try {
            const keys = await this.cacheManager.store.keys(`${prefix}*`);
            const roleKeys = keys.filter(key => key.startsWith(prefix));
            await this.delMultiple(roleKeys);
        } catch (error) {
            this.logger.error(`Error deleting keys with prefix ${prefix} from Redis`, error);
            throw error;
        }
    }

    async delMultiple(keys: string[]): Promise<void> {
        try {
            await Promise.all(keys.map(key => this.cacheManager.del(key)));
        } catch (error) {
            this.logger.error(`Error deleting multiple keys from Redis`, error);
            throw error;
        }
    }

    async reset(): Promise<void> {
        try {
            await this.cacheManager.reset();
        } catch (error) {
            this.logger.error('Error resetting Redis', error);
            throw error;
        }
    }

    async mget(keys: string[]): Promise<any[]> {
        try {
            return await Promise.all(keys.map(key => this.get(key)));
        } catch (error) {
            this.logger.error('Error getting multiple keys from Redis', error);
            throw error;
        }
    }

    async getAllKeyAndValues(): Promise<any> {
        try {
            const key: string[] = await this.cacheManager.store.keys();
            return await Promise.all(
                key.map(async key => {
                    return {
                        key,
                        value: await this.get(key),
                    };
                }),
            );
        } catch (error) {
            this.logger.error('Error getting all keys from Redis', error);
            throw error;
        }
    }

    async getKeysWithPrefix(prefix: string): Promise<string[]> {
        try {
            const keys = await this.cacheManager.store.keys(`${prefix}*`);
            return keys;
        } catch (error) {
            this.logger.error(`Error getting keys with prefix ${prefix} from Redis`, error);
            throw error;
        }
    }

    async zadd(key: string, score: number, member: string): Promise<void> {
        try {
            await this.redisClient.zadd(key, score, member);
        } catch (error) {
            this.logger.error(`Error adding member ${member} to sorted set ${key} in Redis`, error);
            throw error;
        }
    }

    async zcard(key: string): Promise<number> {
        try {
            return await this.redisClient.zcard(key);
        } catch (error) {
            this.logger.error(
                `Error getting sorted set cardinality for key ${key} from Redis`,
                error,
            );
            throw error;
        }
    }

    async zrevrange(
        key: string,
        start: number,
        stop: number,
        withScores = false,
    ): Promise<string[]> {
        try {
            if (withScores) {
                return await this.redisClient.zrevrange(key, start, stop, 'WITHSCORES');
            }
            return await this.redisClient.zrevrange(key, start, stop);
        } catch (error) {
            this.logger.error(`Error getting sorted set range for key ${key} from Redis`, error);
            throw error;
        }
    }

    async lock(key: string, ttlInSeconds = 5000): Promise<Lock> {
        try {
            return this.redlock.acquire([key], ttlInSeconds * 1000);
        } catch (error) {
            this.logger.error(`Error locking key ${key} in Redis`, error);
            throw error;
        }
    }

    async unlock(lock: Lock): Promise<void> {
        try {
            await this.redlock.release(lock);
        } catch (error) {
            this.logger.error(`Error unlocking key ${lock.resources} in Redis`, error);
            throw error;
        }
    }
}
