import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MailEntity } from './mail.entity';

@Injectable()
export class MailRepository extends BaseRepository<MailEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(MailEntity, dataSource, ETableName.MAIL);
    }
}
