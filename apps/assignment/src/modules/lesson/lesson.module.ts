import { getBullConfig } from '@app/common/bull/bull.option';
import { EBullQueue } from '@app/common/constants/queue.constant';
import { FileModule } from '@app/common/file/file.module';
import { PptModule } from '@app/common/ppt/ppt.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { AssignmentModule } from '../assignment/assignment.module';
import { IssueModule } from '../issue/issue.module';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonEntity } from './models/lesson.entity';
import { LessonRepository } from './models/lesson.repository';

@Module({
    imports: [
        AssignmentModule,
        PptModule,
        IssueModule,
        FileModule,
        BullModule.forRootAsync(getBullConfig()),
        BullModule.registerQueue({
            name: EBullQueue.GENERATE_LESSON_QUEUE,
        }),
    ],
    controllers: [LessonController],
    providers: [LessonService, LessonRepository, LessonEntity],
    exports: [LessonService, LessonRepository, LessonEntity],
})
export class LessonModule {}
