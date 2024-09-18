import { EGameStatus, ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { GetGameRequestDto } from 'apps/api/src/modules/game/dtos/get-game-request.dto';
import { DataSource } from 'typeorm';

import { GameEntity } from './game.entity';

@Injectable()
export class GameRepository extends BaseRepository<GameEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(GameEntity, dataSource, ETableName.GAME);
    }

    async findLastGame(): Promise<GameEntity> {
        return this.createQb().orderBy('id', 'DESC').getOne();
    }

    async paginateGames(
        accountId: number,
        getGameRequestDto: GetGameRequestDto,
    ): Promise<[GameEntity[], number]> {
        const qb = this.createQb().leftJoinAndSelect(`${this.alias}.quiz`, 'quiz');

        qb.leftJoinAndMapMany(
            `quiz.questions`,
            'question',
            'question',
            'question.quizId = quiz.id',
        );

        qb.leftJoinAndMapMany(
            `${this.alias}.gameHistories`,
            'game_history',
            'game_history',
            `${this.alias}.id = game_history.gameId`,
        );

        if (getGameRequestDto.quizId) {
            qb.andWhere('quiz.id = :quizId', {
                quizId: getGameRequestDto.quizId,
            });
        }

        qb.andWhere('quiz.accountId = :accountId', {
            accountId,
        });

        qb.andWhere(`${this.alias}.game_status != :status`, {
            status: EGameStatus.ACTIVE,
        });

        if (getGameRequestDto.quizNameSearch) {
            qb.andWhere('quiz.name LIKE :quizNameSearch', {
                quizNameSearch: `${getGameRequestDto.quizNameSearch}%`,
            });
        }

        this.qbPagination(qb, getGameRequestDto);

        return qb.getManyAndCount();
    }
}
