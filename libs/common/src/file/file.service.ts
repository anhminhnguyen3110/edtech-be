import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EFileService } from '../constants/service.constant';
import { AFileService } from './file.abstract';

@Injectable()
export class FileService extends AFileService {
    constructor(
        @Inject(EFileService.BASE_FILE_SERVICE)
        private readonly fileService: AFileService,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    async uploadFile(
        filePath: string,
        externalFilePath: string,
        contentType?: string,
    ): Promise<string> {
        return this.fileService.uploadFile(filePath, externalFilePath, contentType);
    }

    async removeFile(externalFilePath: string): Promise<void> {
        return this.fileService.removeFile(externalFilePath);
    }

    async removeFolder(folderPath: string): Promise<void> {
        return this.fileService.removeFolder(folderPath);
    }

    async getSignedUrl(externalFilePath: string): Promise<string> {
        return this.fileService.getSignedUrl(externalFilePath);
    }

    async updateFileName(externalFilePath: string, newFileName: string): Promise<string> {
        return this.fileService.updateFileName(externalFilePath, newFileName);
    }

    async uploadRawFile(file: Express.Multer.File, targetPath: string): Promise<string> {
        return this.fileService.uploadRawFile(file, targetPath);
    }

    async stageFile(file: Buffer, targetPath: string): Promise<string> {
        return this.fileService.stageFile(file, targetPath);
    }

    async stageFileToLocal(s3FilePath: string, targetPath: string): Promise<string> {
        return this.fileService.stageFileToLocal(s3FilePath, targetPath);
    }

    async deleteStageFile(stageFilePath: string): Promise<void> {
        return this.fileService.deleteStageFile(stageFilePath);
    }
}
