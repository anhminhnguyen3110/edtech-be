import { FileModule } from '@app/common/file/file.module';
import { Module } from '@nestjs/common';

import { FileDeletionModule } from '../utils/file-remove.module';
import { PptService } from './ppt.service';

@Module({
    imports: [FileModule, FileDeletionModule],
    providers: [PptService],
    exports: [PptService],
})
export class PptModule {}
