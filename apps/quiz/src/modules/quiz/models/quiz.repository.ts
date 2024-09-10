import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { GetQuizRequestDto } from 'apps/api/src/modules/quiz/dtos/get-quiz-request.dto';
import { DataSource } from 'typeorm';

import { QuizEntity } from './quiz.entity';

@Injectable()
export class QuizRepository extends BaseRepository<QuizEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(QuizEntity, dataSource, ETableName.QUIZ);
    }

    async getQuizzes(getQuizRequestDto: GetQuizRequestDto): Promise<[QuizEntity[], number]> {
        const { search, classAssignmentId, accountId } = getQuizRequestDto;
        const qb = this.createQb();

        qb.leftJoinAndSelect(`${this.alias}.questions`, 'questions');

        if (search) {
            qb.andWhere(`${this.alias}.name LIKE :search`, {
                search: `${search}%`,
            });
        }

        if (classAssignmentId) {
            qb.andWhere(`${this.alias}.classAssignmentId = :classAssignmentId`, {
                classAssignmentId,
            });
        }

        if (accountId) {
            qb.andWhere(`${this.alias}.accountId = :accountId`, { accountId });
        }
        this.qbPagination(qb, getQuizRequestDto);

        return await qb.getManyAndCount();
    }

    async getQuizDetail(id: number): Promise<QuizEntity> {
        return await this.createQb()
            .leftJoinAndSelect(`${this.alias}.questions`, 'questions')
            .andWhere(`${this.alias}.id = :id`, { id })
            .getOne();
    }

    async getQueryRunner() {
        return this.dataSource.createQueryRunner();
    }
}
