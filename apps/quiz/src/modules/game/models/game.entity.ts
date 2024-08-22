import { EGameStatus, ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { GameHistoryEntity } from '../../game-history/models/game-history.entity';
import { QuizEntity } from '../../quiz/models/quiz.entity';

@Entity(ETableName.GAME)
export class GameEntity extends BaseEntity {
    @ManyToOne(() => QuizEntity, quiz => quiz.games, {
        eager: true,
    })
    @JoinColumn({
        name: 'quiz_id',
    })
    quiz: QuizEntity;

    @Column({
        name: 'quiz_id',
    })
    quizId: number;

    @Column({
        name: 'game_code',
        nullable: true,
    })
    gameCode: string;

    @Column({
        name: 'game_status',
        type: 'enum',
        enum: EGameStatus,
    })
    gameStatus: EGameStatus;

    @OneToMany(() => GameHistoryEntity, gameHistory => gameHistory.game)
    gameHistories: GameHistoryEntity[];
}
