import { RpcException } from '@nestjs/microservices';
import { unlink } from 'fs/promises';

export abstract class AFileService {
    constructor() {}

    abstract uploadFile(
        filePath: string,
        externalFilePath: string,
        contentType?: string,
    ): Promise<string>;
    abstract removeFile(externalFilePath: string): Promise<void>;
    abstract removeFolder(folderPath: string): Promise<void>;
    abstract getSignedUrl(externalFilePath: string): Promise<string>;
    abstract updateFileName(externalFilePath: string, newFileName: string): Promise<string>;
    abstract stageFile(file: Buffer, targetPath: string): Promise<string>;
    abstract stageFileToLocal(s3FilePath: string, targetPath: string): Promise<string>;
    abstract uploadRawFile(file: Express.Multer.File, targetPath: string): Promise<string>;

    async deleteStageFile(filePath: string): Promise<void> {
        try {
            unlink(filePath);
        } catch (error) {
            throw new RpcException(`Error deleting file: ${error.message}`);
        }
    }
}
