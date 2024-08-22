import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { IssueEntity } from './issue.entity';

@Injectable()
export class IssueRepository extends BaseRepository<IssueEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(IssueEntity, dataSource, ETableName.ISSUE);
    }

    createQueryRunner() {
        return this.dataSource.createQueryRunner();
    }
}
