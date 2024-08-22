import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { CriteriaMarkValueEntity } from '../../issue/models/criteria-mark-value.entity';
import { CriteriaEntity } from './criteria.entity';

@Entity(ETableName.CRITERIA_LEVEL)
export class CriteriaLevelEntity extends BaseEntity {
    @ManyToOne(() => CriteriaEntity, criteria => criteria.criteriaLevels, {
        eager: false,
    })
    @JoinColumn({ name: 'criteria_id' })
    criteria: CriteriaEntity;

    @Column({
        name: 'criteria_id',
        nullable: false,
    })
    criteriaId: number;

    @Column({
        name: 'name',
        nullable: false,
    })
    name: string;

    @Column({
        name: 'score',
        nullable: false,
    })
    score: number;

    @OneToMany(
        () => CriteriaMarkValueEntity,
        criteriaMarkValue => criteriaMarkValue.criteriaLevel,
        { eager: false },
    )
    criteriaMarkValues: CriteriaMarkValueEntity[];
}
