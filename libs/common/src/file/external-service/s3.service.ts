import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ELoggerService } from '@app/common/constants/service.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as path from 'path';

import { AFileService } from '../file.abstract';

@Injectable()
export class S3FileService extends AFileService {
    private s3: AWS.S3;
    private readonly bucket = this.configService.get(ECommonConfig.S3_BUCKET_NAME);
    constructor(
        private readonly configService: ConfigService,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {
        super();
        this.s3 = new AWS.S3({
            accessKeyId: this.configService.get(ECommonConfig.AWS_ACCESS_KEY),
            secretAccessKey: this.configService.get(ECommonConfig.AWS_SECRET_KEY),
            region: this.configService.get(ECommonConfig.AWS_REGION),
        });
    }

    async uploadFile(
        filePath: string,
        externalFilePath: string,
        contentType?: string,
    ): Promise<string> {
        const fileContent = await fs.promises.readFile(filePath);

        if (!contentType) {
            contentType = 'image/jpeg';
        }

        const params: PutObjectRequest = {
            Bucket: this.bucket,
            Key: externalFilePath,
            Body: fileContent,
            ContentType: contentType,
        };

        try {
            const data = await this.s3.upload(params).promise();

            this.logger.info(`File uploaded successfully. Location: ${data.Location}`);
            return await this.getSignedUrl(externalFilePath);
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
        }
    }

    async removeFile(externalFilePath: string): Promise<void> {
        const params = {
            Bucket: this.bucket,
            Key: externalFilePath,
        };

        try {
            await this.s3.deleteObject(params).promise();
            this.logger.info(`File deleted successfully. Location: ${externalFilePath}`);
        } catch (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
        }
    }

    async removeFolder(folderPath: string): Promise<void> {
        const params = {
            Bucket: this.bucket,
            Prefix: folderPath,
        };

        try {
            const data = await this.s3.listObjectsV2(params).promise();

            if (data.Contents.length === 0) {
                this.logger.info('Folder is empty. No need to delete');
                return;
            }

            const deleteParams = {
                Bucket: this.bucket,
                Delete: {
                    Objects: data.Contents.map(content => ({
                        Key: content.Key,
                    })),
                },
            };

            await this.s3.deleteObjects(deleteParams).promise();
            this.logger.info(`Folder deleted successfully. Location: ${folderPath}`);
        } catch (error) {
            this.logger.error(`Failed to delete folder: ${error.message}`);
        }
    }

    async updateFileName(externalFilePath: string, newFileName: string): Promise<string> {
        const params = {
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${externalFilePath}`,
            Key: newFileName,
        };

        try {
            await this.s3.copyObject(params).promise();
            await this.removeFile(externalFilePath);
            this.logger.info(`File name updated successfully. New file name: ${newFileName}`);
            return this.getSignedUrl(newFileName);
        } catch (error) {
            this.logger.error(`Failed to update file name: ${error.message}`);
        }
    }

    async getSignedUrl(externalFilePath: string): Promise<string> {
        const params = {
            Bucket: this.bucket,
            Key: externalFilePath,
            Expires: 60 * 60 * 24 * 365,
        };

        try {
            const url = await this.s3.getSignedUrlPromise('getObject', params);
            return url;
        } catch (error) {
            this.logger.error(`Failed to generate signed URL: ${error.message}`);
        }
    }

    async uploadRawFile(file: Express.Multer.File, targetPath: string): Promise<string> {
        const params: PutObjectRequest = {
            Bucket: this.bucket,
            Key: targetPath,
            Body: Buffer.from(file.buffer),
            ContentType: file.mimetype,
        };

        try {
            const data = await this.s3.upload(params).promise();

            this.logger.info(`File uploaded successfully. Location: ${data.Location}`);

            return await this.getSignedUrl(targetPath);
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
        }
    }

    async stageFile(file: Buffer, targetPath: string): Promise<string> {
        const params: PutObjectRequest = {
            Bucket: this.bucket,
            Key: targetPath,
            Body: Buffer.from(file),
        };

        try {
            const data = await this.s3.upload(params).promise();

            this.logger.info(`File staged at S3 successfully. Location: ${data.Location}`);

            return targetPath;
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
        }
    }

    async getFile(externalFilePath: string) {
        const params = {
            Bucket: this.bucket,
            Key: externalFilePath,
        };

        try {
            const data = await this.s3.getObject(params).promise();
            return data.Body;
        } catch (error) {
            this.logger.error(`Failed to get file: ${error.message}`);
        }
    }

    async stageFileToLocal(s3FilePath: string, targetPath: string): Promise<string> {
        const params = {
            Bucket: this.bucket,
            Key: s3FilePath,
        };

        const dir = path.dirname(targetPath);
        try {
            await fs.promises.mkdir(dir, { recursive: true });
        } catch (error) {
            this.logger.error(`Failed to create directory: ${error.message}`);
            throw error;
        }

        return new Promise((resolve, reject) => {
            const s3Stream = this.s3.getObject(params).createReadStream();

            const fileStream = fs.createWriteStream(targetPath);

            s3Stream
                .on('error', error => {
                    this.logger.error(`Failed to stage file locally: ${error.message}`);
                    reject(error);
                })
                .pipe(fileStream)
                .on('error', error => {
                    this.logger.error(`Failed to write file to local disk: ${error.message}`);
                    reject(error);
                })
                .on('close', () => {
                    this.logger.info(`File staged locally successfully. Location: ${targetPath}`);
                    resolve(targetPath);
                });
        });
    }
}
