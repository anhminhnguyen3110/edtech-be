import { Module } from '@nestjs/common';

import { EFileService } from '../constants/service.constant';
import { S3FileService } from './external-service/s3.service';
import { FileService } from './file.service';

@Module({
    imports: [],
    providers: [
        {
            provide: EFileService.FILE_KEY,
            useClass: FileService,
        },
        {
            provide: EFileService.BASE_FILE_SERVICE,
            useClass: S3FileService,
        },
    ],
    exports: [EFileService.FILE_KEY],
})
export class FileModule {}
