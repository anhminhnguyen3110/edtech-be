import { Module } from '@nestjs/common';

import { GameHistoryController } from './game-history.controller';
import { GameHistoryService } from './game-history.service';
import { GameHistoryEntity } from './models/game-history.entity';
import { GameHistoryRepository } from './models/game-history.repository';

@Module({
    controllers: [GameHistoryController],
    providers: [GameHistoryService, GameHistoryRepository, GameHistoryEntity],
})
export class GameHistoryModule {}
