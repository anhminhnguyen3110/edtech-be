import { CommonConfigService } from '@app/common/config/config.service';
import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ELoggerService } from '@app/common/constants/service.constant';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

import { ELogLevel, ILogData } from './interfaces/log-data.interface';
import ILogger from './interfaces/logger.interface';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements ILogger {
    private sourceClass: string;
    private organization: string;
    private app: string;

    public constructor(
        @Inject(INQUIRER) parentClass: object,
        @Inject(ELoggerService.WINSTON)
        private logger: ILogger,
        private readonly commonConfigService: CommonConfigService,
        @Inject(ELoggerService.APP_NAME) appName: string,
    ) {
        this.sourceClass = parentClass?.constructor?.name;
        this.organization = this.commonConfigService.get<string>(ECommonConfig.ORGANIZATION);
        this.app = appName;
    }

    public async log(level: ELogLevel, message: string | Error, data?: ILogData): Promise<void> {
        await this.logger.log(level, message, this.getILogData(data));
    }

    public async debug(message: string, data?: ILogData): Promise<void> {
        await this.logger.debug(message, this.getILogData(data));
    }

    public async info(message: string, data?: ILogData): Promise<void> {
        await this.logger.info(message, this.getILogData(data));
    }

    public async warn(message: string | Error, data?: ILogData): Promise<void> {
        await this.logger.warn(message, this.getILogData(data));
    }

    public async error(message: string | Error, data?: ILogData): Promise<void> {
        await this.logger.error(message, this.getILogData(data));
    }

    public async fatal(message: string | Error, data?: ILogData): Promise<void> {
        await this.logger.fatal(message, this.getILogData(data));
    }

    public async emergency(message: string | Error, data?: ILogData): Promise<void> {
        await this.logger.emergency(message, this.getILogData(data));
    }

    private getILogData(data?: ILogData): ILogData {
        return {
            ...data,
            organization: data?.organization || this.organization,
            app: data?.app || this.app,
            sourceClass: data?.sourceClass || this.sourceClass,
            prop: data?.prop || undefined,
        };
    }
}
