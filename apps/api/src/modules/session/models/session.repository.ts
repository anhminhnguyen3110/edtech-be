import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SessionEntity } from './session.entity';

@Injectable()
export class SessionRepository extends BaseRepository<SessionEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(SessionEntity, dataSource, ETableName.SESSION);
    }
}
