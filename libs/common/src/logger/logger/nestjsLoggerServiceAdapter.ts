import { ConsoleLogger } from '@nestjs/common';
import { LoggerService } from '@nestjs/common/services/logger.service';

import ILogger from './interfaces/logger.interface';

export default class LoggerServiceAdapter extends ConsoleLogger implements LoggerService {
    public constructor(private logger: ILogger) {
        super();
    }

    public log(message: any, ...optionalParams: any[]) {
        return this.logger.info(message, this.getILogData(optionalParams));
    }

    public error(message: any, ...optionalParams: any[]) {
        return this.logger.error(message, this.getILogData(optionalParams));
    }

    public warn(message: any, ...optionalParams: any[]) {
        return this.logger.warn(message, this.getILogData(optionalParams));
    }

    public debug(message: any, ...optionalParams: any[]) {
        return this.logger.debug(message, this.getILogData(optionalParams));
    }

    public verbose(message: any, ...optionalParams: any[]) {
        return this.logger.info(message, this.getILogData(optionalParams));
    }

    private getILogData(...optionalParams: any[]) {
        return {
            sourceClass: optionalParams[0] ? optionalParams[0] : undefined,
        };
    }
}
