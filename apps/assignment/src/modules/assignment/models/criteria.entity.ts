import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { AssignmentEntity } from '../../assignment/models/assignment.entity';
import { CriteriaLevelEntity } from '../../assignment/models/criteria-level.entity';

@Entity(ETableName.CRITERIA)
export class CriteriaEntity extends BaseEntity {
    @ManyToOne(() => AssignmentEntity, assignment => assignment.criteria, {
        eager: false,
    })
    @JoinColumn({ name: 'assignment_id' })
    assignment: AssignmentEntity;

    @Column({
        name: 'assignment_id',
        nullable: false,
    })
    assignmentId: number;

    @Column({
        name: 'description',
        nullable: true,
    })
    description?: string;

    @OneToMany(() => CriteriaLevelEntity, criteriaLevel => criteriaLevel.criteria, { eager: false })
    criteriaLevels: CriteriaLevelEntity[];
}
