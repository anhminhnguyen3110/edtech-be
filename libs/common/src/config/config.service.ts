import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

import { ECommonConfig } from './interfaces/config.interface';

@Injectable()
export class CommonConfigService {
    constructor(private configService: NestConfigService) {}

    get isProduction(): boolean {
        return this.environment === 'production';
    }

    get isDevelopment(): boolean {
        return this.environment === 'development';
    }

    get isTest(): boolean {
        return this.environment === 'test';
    }

    get slackWebhookUrl(): string {
        return this.configService.get<string>('SLACK_INC_WEBHOOK_URL');
    }

    private get environment(): string {
        return this.configService.get<string>('NODE_ENV');
    }

    public get<T>(val: ECommonConfig) {
        return this.configService.get<T>(val);
    }
}
