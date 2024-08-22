import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { ClassAssignmentEntity } from '../../assignment/models/class-assignment.entity';

@Entity(ETableName.ISSUE)
@Unique(['name', 'classAssignmentId'])
@Index(['classAssignmentId'])
export class IssueEntity extends BaseEntity {
    @ManyToOne(() => ClassAssignmentEntity, classAssignmentEntity => classAssignmentEntity.issues, {
        eager: true,
    })
    @JoinColumn({ name: 'class_assignment_id' })
    classAssignment: ClassAssignmentEntity;

    @Column({
        name: 'class_assignment_id',
        nullable: false,
    })
    classAssignmentId: number;

    @Column({
        name: 'name',
        nullable: true,
    })
    name: string;

    @Column({
        name: 'student_count',
        type: 'int',
        nullable: true,
    })
    studentCount: number;

    @Column({
        name: 'student_rate',
        nullable: true,
    })
    studentRate: string;

    @Column({
        name: 'description',
        nullable: true,
    })
    description: string;
}
