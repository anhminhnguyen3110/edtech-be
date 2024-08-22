import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CriteriaEntity } from './criteria.entity';

@Injectable()
export class CriteriaRepository extends BaseRepository<CriteriaEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(CriteriaEntity, dataSource, ETableName.CRITERIA);
    }
}
