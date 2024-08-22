import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ClassAssignmentEntity } from './class-assignment.entity';

@Injectable()
export class ClassAssignmentRepository extends BaseRepository<ClassAssignmentEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(ClassAssignmentEntity, dataSource, ETableName.CLASS_ASSIGNMENT);
    }

    async findOneByClassIdAndAssignmentId(
        classId: number,
        assignmentId: number,
    ): Promise<ClassAssignmentEntity> {
        return this.findOne({
            where: { classId, assignmentId },
        });
    }
}
