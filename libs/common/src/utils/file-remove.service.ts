import { Inject, Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';

import { ELoggerService } from '../constants/service.constant';
import ILogger from '../logger/logger/interfaces/logger.interface';

@Injectable()
export class FileDeletionService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async deleteFile(filePath: string): Promise<void> {
        try {
            await unlink(filePath);
            this.logger.info(`File deleted: ${filePath}`);
        } catch (error) {}
    }
}
