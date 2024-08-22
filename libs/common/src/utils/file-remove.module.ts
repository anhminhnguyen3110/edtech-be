import { Module } from '@nestjs/common';

import { FileDeletionService } from './file-remove.service';

@Module({
    providers: [FileDeletionService],
    exports: [FileDeletionService],
})
export class FileDeletionModule {}
