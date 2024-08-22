import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
    imports: [NotificationModule],
    controllers: [GameController],
    providers: [GameService],
})
export class GameModule {}
