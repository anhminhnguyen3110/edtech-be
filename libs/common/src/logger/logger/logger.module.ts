import { CommonConfigModule } from '@app/common/config/config.module';
import { CommonConfigService } from '@app/common/config/config.service';
import { ELoggerService } from '@app/common/constants/service.constant';
import {
    DynamicModule,
    Global,
    Inject,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import * as morgan from 'morgan';

import WinstonLogger from '../services/winston.service';
import ILogger from './interfaces/logger.interface';
import { LoggerService } from './logger.service';
import LoggerServiceAdapter from './nestjsLoggerServiceAdapter';

@Global()
@Module({
    imports: [CommonConfigModule],
})
export class LoggerModule implements NestModule {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private logger: ILogger,
        private configService: CommonConfigService,
    ) {}

    static forRootAsync(options: {
        imports: any[];
        inject: any[];
        useFactory: (...args: any[]) => Promise<string> | string;
    }): DynamicModule {
        return {
            module: LoggerModule,
            imports: options.imports,
            providers: [
                {
                    provide: ELoggerService.WINSTON,
                    useClass: WinstonLogger,
                },
                {
                    provide: ELoggerService.APP_NAME,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                {
                    provide: ELoggerService.LOGGER_KEY,
                    useClass: LoggerService,
                },
                {
                    provide: ELoggerService.LOGGER_ADAPTER,
                    useFactory: (logger: ILogger) => new LoggerServiceAdapter(logger),
                    inject: [ELoggerService.LOGGER_KEY],
                },
            ],
            exports: [ELoggerService.LOGGER_KEY, ELoggerService.LOGGER_ADAPTER],
        };
    }

    static forRoot(appName: string): DynamicModule {
        return {
            module: LoggerModule,
            providers: [
                {
                    provide: ELoggerService.WINSTON,
                    useClass: WinstonLogger,
                },
                {
                    provide: ELoggerService.APP_NAME,
                    useValue: appName,
                },
                {
                    provide: ELoggerService.LOGGER_KEY,
                    useClass: LoggerService,
                },
                {
                    provide: ELoggerService.LOGGER_ADAPTER,
                    useFactory: (logger: ILogger) => new LoggerServiceAdapter(logger),
                    inject: [ELoggerService.LOGGER_KEY],
                },
            ],
            exports: [ELoggerService.LOGGER_KEY, ELoggerService.LOGGER_ADAPTER],
        };
    }

    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(
                morgan(this.configService.isProduction ? 'combined' : 'dev', {
                    stream: {
                        write: (message: string) => {
                            this.logger.debug(message, {
                                sourceClass: 'MorganService',
                            });
                        },
                    },
                }),
            )
            .forRoutes('*');
    }
}
