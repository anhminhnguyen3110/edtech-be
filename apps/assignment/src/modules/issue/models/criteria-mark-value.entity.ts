import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CriteriaLevelEntity } from '../../assignment/models/criteria-level.entity';
import { MarkedAssessmentEntity } from './mark-assessment.entity';

@Entity(ETableName.CRITERIA_MARK_VALUE)
export class CriteriaMarkValueEntity extends BaseEntity {
    @ManyToOne(() => MarkedAssessmentEntity, markedAssessment => markedAssessment.id, {
        eager: false,
    })
    @JoinColumn({ name: 'marked_assessment_id' })
    markedAssessment: MarkedAssessmentEntity;

    @Column({
        name: 'marked_assessment_id',
        nullable: false,
    })
    markedAssessmentId: number;

    @ManyToOne(() => CriteriaLevelEntity, criteriaLevel => criteriaLevel.criteriaMarkValues, {
        eager: false,
    })
    @JoinColumn({ name: 'criteria_level_id' })
    criteriaLevel: CriteriaLevelEntity;

    @Column({
        name: 'criteria_level_id',
        nullable: false,
    })
    criteriaLevelId: number;
}
