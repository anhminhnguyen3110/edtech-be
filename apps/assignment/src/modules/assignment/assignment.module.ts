import { Module } from '@nestjs/common';

import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { AssignmentEntity } from './models/assignment.entity';
import { AssignmentRepository } from './models/assignment.repository';
import { ClassAssignmentEntity } from './models/class-assignment.entity';
import { ClassAssignmentRepository } from './models/class-assignment.repository';
import { CriteriaLevelRepository } from './models/criteria-level.repository';
import { CriteriaRepository } from './models/criteria.repository';

@Module({
    controllers: [AssignmentController],
    providers: [
        AssignmentService,
        AssignmentEntity,
        AssignmentRepository,
        ClassAssignmentRepository,
        ClassAssignmentEntity,
        CriteriaLevelRepository,
        CriteriaRepository,
    ],
    exports: [
        AssignmentService,
        AssignmentRepository,
        AssignmentEntity,
        ClassAssignmentRepository,
        ClassAssignmentEntity,
        CriteriaLevelRepository,
        CriteriaRepository,
    ],
})
export class AssignmentModule {}
