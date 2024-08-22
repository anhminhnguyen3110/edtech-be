import { ELoggerService } from '@app/common/constants/service.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}
    async testLog() {
        // Info
        await this.logger.debug('I am a debug message!');

        // Debug
        await this.logger.info('I am an info message!');

        // Warn
        await this.logger.warn('I am a warn message!');

        // Error
        await this.logger.error('I am an error message!');

        // Fatal
        await this.logger.fatal('I am a fatal message!');

        // Emergency
        await this.logger.emergency('I am an emergency message!');
    }
}
