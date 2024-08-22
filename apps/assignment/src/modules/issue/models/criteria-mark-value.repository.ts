import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { CriteriaMarkValueEntity } from './criteria-mark-value.entity';

@Injectable()
export class CriteriaMarkValueRepository extends BaseRepository<CriteriaMarkValueEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(CriteriaMarkValueEntity, dataSource, ETableName.CRITERIA_MARK_VALUE);
    }

    findByMarkedAssessments(markedAssessmentIds: number[]): Promise<CriteriaMarkValueEntity[]> {
        return this.find({
            where: {
                markedAssessmentId: In(markedAssessmentIds),
            },
        });
    }
}
