import { EQuestionType, ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Exclude } from 'class-transformer';
import { AfterLoad, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { GameHistoryEntity } from '../../game-history/models/game-history.entity';
import { QuizEntity } from '../../quiz/models/quiz.entity';

@Entity(ETableName.QUESTION)
export class QuestionEntity extends BaseEntity {
    @Column({
        name: 'question_text',
        nullable: false,
    })
    questionText: string;

    @Column({
        name: 'question_type',
        type: 'enum',
        enum: EQuestionType,
    })
    questionType: EQuestionType;

    @Column({
        name: 'choices',
        nullable: true,
    })
    choicesInDatabase: string;

    @OneToMany(() => GameHistoryEntity, gameHistory => gameHistory.question)
    gameHistories: GameHistoryEntity[];

    @Column({
        name: 'correct_answers',
        nullable: true,
    })
    correctAnswersInDatabase: string;

    @Column({
        name: 'time_limit_in_second',
        nullable: false,
        default: 30,
    })
    timeLimitInSecond: number;

    @ManyToOne(() => QuizEntity, quiz => quiz.questions, {
        eager: false,
    })
    @JoinColumn({ name: 'quiz_id' })
    quiz: QuizEntity;

    @Column({
        name: 'quiz_id',
        nullable: false,
    })
    quizId: number;

    @Column({
        name: 'image_format',
        nullable: true,
        default: null,
    })
    imageFormat: string;

    @Exclude()
    choices: string[];

    @Exclude()
    correctAnswers: string[];

    @BeforeInsert()
    parseChoicesAndCorrectAnswers() {
        if (this.choices) {
            this.choicesInDatabase = JSON.stringify(this.choices);
        }
        if (this.correctAnswers) {
            this.correctAnswersInDatabase = JSON.stringify(this.correctAnswers);
        }
    }

    @AfterLoad()
    parseChoicesAndCorrectAnswersAfterLoad() {
        if (this.choicesInDatabase && typeof this.choicesInDatabase === 'string') {
            this.choices = JSON.parse(this.choicesInDatabase as string);
        }
        if (this.correctAnswersInDatabase && typeof this.correctAnswersInDatabase === 'string') {
            this.correctAnswers = JSON.parse(this.correctAnswersInDatabase as string);
        }
    }
}
