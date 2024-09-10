import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import {
    AfterLoad,
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    Unique,
} from 'typeorm';

import { GameEntity } from '../../game/models/game.entity';
import { QuestionEntity } from '../../question/models/question.entity';

@Entity(ETableName.GAME_HISTORY)
@Index(['gameId'])
@Index(['questionId'])
@Index(['nickname'])
@Unique(['gameId', 'playerId', 'questionId'])
export class GameHistoryEntity extends BaseEntity {
    @ManyToOne(() => GameEntity, game => game.gameHistories, {
        eager: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'game_id',
    })
    game: GameEntity;

    @Column({
        name: 'game_id',
        type: 'int',
    })
    gameId: number;

    @Column({
        name: 'player_id',
        type: 'int',
    })
    playerId: number;

    @ManyToOne(() => QuestionEntity, question => question.gameHistories, {
        eager: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'question_id',
    })
    question: QuestionEntity;

    @Column({
        name: 'question_id',
        type: 'int',
    })
    questionId: number;

    @Column({
        name: 'player_answer',
        type: 'varchar',
        length: 255,
    })
    playerAnswerInDb: string;

    playerAnswer: string[];

    @Column({
        name: 'is_correct',
        type: 'boolean',
        default: false,
    })
    isCorrect: boolean;

    @Column({
        name: 'point_awarded',
        type: 'int',
        default: 0,
    })
    pointAwarded: number;

    @Column({
        name: 'score',
        type: 'int',
        default: 0,
    })
    score: number;

    @Column({
        name: 'strike_count',
        type: 'int',
        default: 0,
    })
    strikeCount: number;

    @Column({
        name: 'time_submitted',
        type: 'timestamp',
    })
    timeSubmitted: Date;

    @Column({
        name: 'time_spent',
        type: 'double',
    })
    timeSpent: number;

    @Column({
        name: 'nickname',
        type: 'varchar',
        length: 255,
    })
    nickname: string;

    @Column({
        name: 'number_of_correct_answers',
        type: 'int',
        default: 0,
    })
    numberOfCorrectAnswers: number;

    @Column({
        name: 'player_rank',
        type: 'int',
        nullable: true,
    })
    rank?: number;

    @BeforeInsert()
    setPlayerAnswerInDb() {
        this.playerAnswerInDb = JSON.stringify(this.playerAnswer);
    }

    @AfterLoad()
    setPlayerAnswer() {
        this.playerAnswer = JSON.parse(this.playerAnswerInDb);
    }
}
