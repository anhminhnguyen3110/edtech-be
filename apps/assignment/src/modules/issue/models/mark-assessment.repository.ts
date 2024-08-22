import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MarkedAssessmentEntity } from './mark-assessment.entity';

@Injectable()
export class MarkedAssessmentRepository extends BaseRepository<MarkedAssessmentEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(MarkedAssessmentEntity, dataSource, ETableName.MARKED_ASSESSMENT);
    }

    async findByAssignmentAndClass(
        assignmentId: number,
        classId: number,
    ): Promise<[MarkedAssessmentEntity[], number]> {
        const qb = this.createQb();
        qb.where(`${this.alias}.assignmentId = :assignmentId`, {
            assignmentId,
        });
        qb.andWhere(`${this.alias}.classId = :classId`, { classId });
        qb.andWhere(`${this.alias}.extractedText IS NOT NULL`);
        return qb.getManyAndCount();
    }
}
