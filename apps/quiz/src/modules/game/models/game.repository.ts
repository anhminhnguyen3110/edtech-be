import { ETableName } from '@app/common/constants/table.constant';
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

    async paginateGames(getGameRequestDto: GetGameRequestDto): Promise<[GameEntity[], number]> {
        const qb = this.createQb().leftJoinAndSelect(`${this.alias}.quiz`, 'quiz');

        if (getGameRequestDto.quizId) {
            qb.andWhere('quiz.id = :quizId', {
                quizId: getGameRequestDto.quizId,
            });
        }

        this.qbPagination(qb, getGameRequestDto);

        return qb.getManyAndCount();
    }
}
