import { Inject, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join, parse } from 'path';
import { v4 as uuid } from 'uuid';

import { ECommonConfig } from '../config/interfaces/config.interface';
import { EFileService, ELoggerService } from '../constants/service.constant';
import { AFileService } from '../file/file.abstract';
import ILogger from '../logger/logger/interfaces/logger.interface';

@Injectable()
export class DocumentPipe implements PipeTransform<Express.Multer.File, Promise<string>> {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        private readonly configService: ConfigService,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,
    ) {}

    async transform(document: Express.Multer.File): Promise<any> {
        if (!document)
            return {
                stageFilePath: null,
                originalFileName: null,
                s3StageFilePath: null,
            };

        const pathToSave = this.configService.get<string>(ECommonConfig.STAGE_PATH);

        try {
            const uniqueSuffix = uuid();
            const fileExtension = parse(document.originalname).ext;
            const originalFileName = parse(document.originalname).name;
            const filename = `${Date.now()}-${uniqueSuffix}.${originalFileName}${fileExtension}`;
            const stageFilePath = join(pathToSave, filename);
            const s3StageFilePath = stageFilePath.replace(/\\/g, '/'); // Replace all backslashes

            await this.fileService.stageFile(document.buffer, s3StageFilePath);

            this.logger.info(`File saved at ${stageFilePath}`);

            return {
                stageFilePath: stageFilePath,
                s3StageFilePath: s3StageFilePath,
                originalFileName: document.originalname,
            };
        } catch (error) {
            this.logger.error(`Error saving file: ${error.message}`);
            throw error;
        }
    }
}
