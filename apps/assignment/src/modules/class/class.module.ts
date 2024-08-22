import { FileModule } from '@app/common/file/file.module';
import { Module } from '@nestjs/common';

import { AssignmentModule } from '../assignment/assignment.module';
import { IssueModule } from '../issue/issue.module';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { ClassEntity } from './models/class.entity';
import { ClassRepository } from './models/class.repository';

@Module({
    imports: [AssignmentModule, IssueModule, FileModule],
    controllers: [ClassController],
    providers: [ClassService, ClassRepository, ClassEntity],
})
export class ClassModule {}
