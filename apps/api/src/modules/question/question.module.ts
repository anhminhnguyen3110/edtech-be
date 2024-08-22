import { FileModule } from '@app/common/file/file.module';
import { FileDeletionModule } from '@app/common/utils/file-remove.module';
import { Module } from '@nestjs/common';

import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
    imports: [FileDeletionModule, FileModule],
    controllers: [QuestionController],
    providers: [QuestionService],
    exports: [QuestionService],
})
export class QuestionModule {}
