import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { CriteriaLevelEntity } from './criteria-level.entity';

@Injectable()
export class CriteriaLevelRepository extends BaseRepository<CriteriaLevelEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(CriteriaLevelEntity, dataSource, ETableName.CRITERIA_LEVEL);
    }

    async findByCriteriaIds(criteriaIds: number[]): Promise<CriteriaLevelEntity[]> {
        return this.find({
            where: {
                criteriaId: In(criteriaIds),
            },
        });
    }
}
