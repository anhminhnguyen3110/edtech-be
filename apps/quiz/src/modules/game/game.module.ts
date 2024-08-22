import { RedisModule } from '@app/common/redis/redis.module';
import { Module } from '@nestjs/common';

import { QuizModule } from '../quiz/quiz.module';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameHelperService } from './game.helper';
import { GameService } from './game.service';
import { GameEntity } from './models/game.entity';
import { GameRepository } from './models/game.repository';

@Module({
    imports: [QuizModule, RedisModule],
    controllers: [GameController],
    providers: [GameService, GameEntity, GameRepository, GameGateway, GameHelperService],
    exports: [GameService, GameEntity, GameRepository, GameGateway],
})
export class GameModule {}
