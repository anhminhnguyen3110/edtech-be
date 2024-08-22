import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { AssignmentEntity } from '../../assignment/models/assignment.entity';
import { ClassEntity } from '../../class/models/class.entity';
import { IssueEntity } from '../../issue/models/issue.entity';
import { LessonEntity } from '../../lesson/models/lesson.entity';

@Entity(ETableName.CLASS_ASSIGNMENT)
export class ClassAssignmentEntity extends BaseEntity {
    @ManyToOne(() => ClassEntity, classEntity => classEntity.classAssignments, {
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'class_id' })
    class: ClassEntity;

    @ManyToOne(() => AssignmentEntity, assignmentEntity => assignmentEntity.classAssignments, {
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'assignment_id' })
    assignment: AssignmentEntity;

    @Column({
        name: 'class_id',
        nullable: false,
    })
    classId: number;

    @Column({
        name: 'assignment_id',
        nullable: false,
    })
    assignmentId: number;

    @Column({
        name: 'account_id',
    })
    accountId: number;

    @OneToMany(() => LessonEntity, lessonEntity => lessonEntity.classAssignment, {
        eager: false,
    })
    lessons: LessonEntity[];

    @OneToMany(() => IssueEntity, issueEntity => issueEntity.classAssignment, {
        eager: false,
    })
    issues: IssueEntity[];
}
