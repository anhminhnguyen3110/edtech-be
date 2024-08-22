import { Inject, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join, parse } from 'path';
import * as sharp from 'sharp';
import { v4 as uuid } from 'uuid';

import { ECommonConfig } from '../config/interfaces/config.interface';
import { EFileService, ELoggerService } from '../constants/service.constant';
import { AFileService } from '../file/file.abstract';
import ILogger from '../logger/logger/interfaces/logger.interface';

@Injectable()
export class ImagePipe implements PipeTransform<Express.Multer.File, Promise<any>> {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        private readonly configService: ConfigService,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,
    ) {}

    async transform(image: Express.Multer.File): Promise<any> {
        if (!image) return null;
        const pathToSave = this.configService.get<string>(ECommonConfig.STAGE_PATH);

        try {
            const uniqueSuffix = uuid();
            const originalName = parse(image.originalname).name;
            const filename = `${originalName}-${uniqueSuffix}.jpg`; // Save as JPG

            const metadata = await sharp(image.buffer).metadata();
            const originalWidth = metadata.width;
            const originalHeight = metadata.height;
            const originalSizeKB = image.size / 1024; // convert bytes to kilobytes

            // Calculate the ratio and new dimensions
            const ratio =
                Math.max(originalWidth, originalHeight) /
                this.configService.get<number>(ECommonConfig.IMAGE_SIZE_PIXEL);
            const newWidth = Math.round(originalWidth / ratio);
            const newHeight = Math.round(originalHeight / ratio);

            // Resize image with the new dimensions and convert to JPEG with adjusted quality
            const resizedImageBuffer = await sharp(image.buffer)
                .resize({
                    width: newWidth,
                    height: newHeight,
                    fit: 'fill',
                })
                .jpeg({
                    quality: this.configService.get<number>(ECommonConfig.IMAGE_QUALITY),
                }) // Adjust quality for JPEG images
                .toBuffer();

            const resizedImageSizeKB = resizedImageBuffer.length / 1024; // convert bytes to kilobytes
            const filePathToSave = join(pathToSave, filename);
            const s3StageFilePath = filePathToSave.replace(/\\/g, '/'); // Replace all backslashes

            await this.fileService.stageFile(resizedImageBuffer, s3StageFilePath);

            // Calculate and log the size ratio
            const sizeRatio = (originalSizeKB / resizedImageSizeKB) * 100;
            this.logger.debug(`Original image size: ${originalSizeKB.toFixed(2)} KB`);
            this.logger.debug(`Resized image size: ${resizedImageSizeKB.toFixed(2)} KB`);
            this.logger.debug(`Size reduction ratio: ${sizeRatio.toFixed(2)}%`);

            return s3StageFilePath;
        } catch (err) {
            this.logger.error(err);
        }
    }
}
