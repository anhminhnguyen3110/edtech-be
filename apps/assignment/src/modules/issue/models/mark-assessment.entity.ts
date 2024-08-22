import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AssignmentEntity } from '../../assignment/models/assignment.entity';
import { ClassEntity } from '../../class/models/class.entity';

@Entity(ETableName.MARKED_ASSESSMENT)
export class MarkedAssessmentEntity extends BaseEntity {
    @ManyToOne(() => AssignmentEntity, assignment => assignment.markedAssessments, { eager: false })
    @JoinColumn({ name: 'assessment_id' })
    assignment: AssignmentEntity;

    @Column({
        name: 'assessment_id',
        nullable: false,
    })
    assignmentId: number;

    @Column({
        name: 'student_name',
        nullable: true,
    })
    studentName: string;

    @Column({
        name: 'feedback',
        type: 'text',
        nullable: true,
    })
    feedback: string;

    @Column({
        name: 'extracted_text',
        type: 'text',
        nullable: true,
    })
    extractedText: string;

    @ManyToOne(() => ClassEntity, classEntity => classEntity.markedAssessments, { eager: false })
    @JoinColumn({ name: 'class_id' })
    class: ClassEntity;

    @Column({
        name: 'class_id',
        nullable: false,
    })
    classId: number;
}
