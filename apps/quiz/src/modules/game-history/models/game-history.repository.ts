import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GameHistoryEntity } from './game-history.entity';

@Injectable()
export class GameHistoryRepository extends BaseRepository<GameHistoryEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(GameHistoryEntity, dataSource, ETableName.GAME_HISTORY);
    }

    async getQueryRunner() {
        return this.dataSource.createQueryRunner();
    }
}
