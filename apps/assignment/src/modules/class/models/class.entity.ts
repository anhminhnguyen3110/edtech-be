import { ETableName, EYear } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

import { ClassAssignmentEntity } from '../../assignment/models/class-assignment.entity';
import { MarkedAssessmentEntity } from '../../issue/models/mark-assessment.entity';

@Entity(ETableName.CLASS)
export class ClassEntity extends BaseEntity {
    @Column({
        name: 'year',
        type: 'enum',
        enum: EYear,
        nullable: false,
    })
    year: EYear;

    @Column({
        name: 'name',
        nullable: false,
    })
    name: string;

    @Column({
        name: 'subject',
        nullable: false,
    })
    subject: string;

    @OneToMany(() => ClassAssignmentEntity, classAssignment => classAssignment.class, {
        eager: false,
    })
    classAssignments: ClassAssignmentEntity[];

    @OneToMany(() => MarkedAssessmentEntity, markedAssessment => markedAssessment.class, {
        eager: false,
    })
    markedAssessments: MarkedAssessmentEntity[];
}
