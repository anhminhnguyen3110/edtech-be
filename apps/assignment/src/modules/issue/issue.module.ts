import { getBullConfig } from '@app/common/bull/bull.option';
import { EBullQueue } from '@app/common/constants/queue.constant';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { AssignmentModule } from '../assignment/assignment.module';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { CriteriaMarkValueRepository } from './models/criteria-mark-value.repository';
import { IssueEntity } from './models/issue.entity';
import { IssueRepository } from './models/issue.repository';
import { MarkedAssessmentRepository } from './models/mark-assessment.repository';

@Module({
    imports: [
        AssignmentModule,
        BullModule.forRootAsync(getBullConfig()),
        BullModule.registerQueue({
            name: EBullQueue.EXTRACT_ISSUE_QUEUE,
        }),
    ],
    controllers: [IssueController],
    providers: [
        IssueService,
        IssueRepository,
        IssueEntity,
        CriteriaMarkValueRepository,
        MarkedAssessmentRepository,
    ],
    exports: [
        IssueService,
        IssueRepository,
        IssueEntity,
        CriteriaMarkValueRepository,
        MarkedAssessmentRepository,
    ],
})
export class IssueModule {}
