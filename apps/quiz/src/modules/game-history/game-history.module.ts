import { FileModule } from '@app/common/file/file.module';
import { LanguageModelModule } from '@app/common/language-model/language-model.module';
import { Module } from '@nestjs/common';

import { GameModule } from '../game/game.module';
import { GameHistoryController } from './game-history.controller';
import { GameHistoryService } from './game-history.service';
import { GameHistoryEntity } from './models/game-history.entity';
import { GameHistoryRepository } from './models/game-history.repository';

@Module({
    imports: [GameModule, FileModule, LanguageModelModule],
    controllers: [GameHistoryController],
    providers: [GameHistoryService, GameHistoryRepository, GameHistoryEntity],
})
export class GameHistoryModule {}
