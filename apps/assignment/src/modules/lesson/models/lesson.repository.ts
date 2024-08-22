import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { LessonEntity } from './lesson.entity';

@Injectable()
export class LessonRepository extends BaseRepository<LessonEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(LessonEntity, dataSource, ETableName.LESSON);
    }

    async getQueryRunner() {
        return this.dataSource.createQueryRunner();
    }
}
