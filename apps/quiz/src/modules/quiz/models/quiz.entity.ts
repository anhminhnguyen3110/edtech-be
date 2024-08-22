import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { GameEntity } from '../../game/models/game.entity';
import { QuestionEntity } from '../../question/models/question.entity';

@Entity(ETableName.QUIZ)
@Index(['name'])
export class QuizEntity extends BaseEntity {
    @Column({ name: 'account_id', nullable: false })
    accountId: number;

    @Column({ name: 'class_assignment_id', nullable: false })
    classAssignmentId: number;

    @Column({
        name: 'name',
        nullable: false,
    })
    name: string;

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description: string;

    @OneToMany(() => QuestionEntity, question => question.quiz, {
        eager: false,
        cascade: true,
    })
    questions: QuestionEntity[];

    @OneToMany(() => GameEntity, game => game.quiz, {
        eager: false,
    })
    games: GameEntity[];
}
