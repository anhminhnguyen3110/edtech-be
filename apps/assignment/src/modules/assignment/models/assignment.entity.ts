import { ETableName, EYear } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

import { MarkedAssessmentEntity } from '../../issue/models/mark-assessment.entity';
import { ClassAssignmentEntity } from './class-assignment.entity';
import { CriteriaEntity } from './criteria.entity';

@Entity(ETableName.ASSIGNMENT)
export class AssignmentEntity extends BaseEntity {
    @Column({
        name: 'name',
        nullable: false,
    })
    name: string;

    @Column({
        name: 'year',
        type: 'enum',
        enum: EYear,
        nullable: false,
    })
    year: EYear;

    @OneToMany(() => ClassAssignmentEntity, classAssignment => classAssignment.assignment, {
        eager: false,
    })
    classAssignments: ClassAssignmentEntity[];

    @OneToMany(() => CriteriaEntity, criteria => criteria.assignment, {
        eager: false,
    })
    criteria: CriteriaEntity[];

    @OneToMany(() => MarkedAssessmentEntity, markedAssessment => markedAssessment.assignment, {
        eager: false,
    })
    markedAssessments: MarkedAssessmentEntity[];
}
