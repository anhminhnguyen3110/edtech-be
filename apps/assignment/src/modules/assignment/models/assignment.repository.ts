import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { GetAssignmentRequestDto } from 'apps/api/src/modules/assignment/dtos/get-assignment-request.dto';
import { DataSource } from 'typeorm';

import { AssignmentEntity } from './assignment.entity';

@Injectable()
export class AssignmentRepository extends BaseRepository<AssignmentEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(AssignmentEntity, dataSource, ETableName.ASSIGNMENT);
    }

    async findOneWithDetails(id: number, accountId: number): Promise<AssignmentEntity> {
        const qb = this.createQb();
        qb.where(`${this.alias}.id = :id`, { id });

        qb.innerJoinAndSelect(
            `${this.alias}.classAssignments`,
            'classAssignment',
            'classAssignment.assignmentId = assignment.id AND classAssignment.accountId = :accountId',
            { accountId },
        );

        qb.leftJoinAndSelect(`classAssignment.class`, 'class');

        qb.leftJoinAndSelect(`${this.alias}.criteria`, 'criteria');
        qb.leftJoinAndSelect(`criteria.criteriaLevels`, 'criteriaLevels');

        return qb.getOne();
    }

    async findMany(
        getAssignmentRequestDto: GetAssignmentRequestDto,
        accountId: number,
    ): Promise<[AssignmentEntity[], number]> {
        const qb = this.createQb();
        qb.innerJoin(
            `${this.alias}.classAssignments`,
            'classAssignment',
            'classAssignment.assignmentId = assignment.id AND classAssignment.accountId = :accountId',
            { accountId },
        );

        if (getAssignmentRequestDto.name) {
            qb.andWhere(`${this.alias}.name LIKE :name`, {
                name: `%${getAssignmentRequestDto.name}%`,
            });
        }

        if (getAssignmentRequestDto.year) {
            qb.andWhere(`${this.alias}.year = :year`, {
                year: getAssignmentRequestDto.year,
            });
        }

        this.qbPagination(qb, getAssignmentRequestDto);

        return qb.getManyAndCount();
    }
}
