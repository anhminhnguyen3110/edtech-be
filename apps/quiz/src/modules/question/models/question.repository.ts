import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { QuestionEntity } from './question.entity';

@Injectable()
export class QuestionRepository extends BaseRepository<QuestionEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(QuestionEntity, dataSource, ETableName.QUESTION);
    }

    async findByQuizIdWithRelations(id: number): Promise<QuestionEntity> {
        return this.createQb()
            .where(`${this.alias}.id = :id`, { id })
            .leftJoinAndSelect(`${this.alias}.quiz`, 'quiz')
            .getOne();
    }
}
