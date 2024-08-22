import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ClassEntity } from './class.entity';

@Injectable()
export class ClassRepository extends BaseRepository<ClassEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(ClassEntity, dataSource, ETableName.CLASS);
    }

    async findOneWithDetails(classAssignmentId: number, accountId: number): Promise<ClassEntity> {
        const qb = this.createQb();

        qb.innerJoinAndSelect(
            `${this.alias}.classAssignments`,
            'classAssignment',
            `${this.alias}.id = classAssignment.classId AND
             classAssignment.accountId = :accountId AND
             classAssignment.id = :classAssignmentId`,
            {
                accountId,
                classAssignmentId,
            },
        );

        qb.leftJoinAndSelect('classAssignment.lessons', 'lesson');
        qb.leftJoinAndSelect('classAssignment.issues', 'issue');
        return qb.getOne();
    }
}
