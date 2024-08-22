import { ECommandGameHistory } from '@app/common/constants/command.constant';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { GameHistoryService } from './game-history.service';

@Controller()
export class GameHistoryController {
    constructor(private readonly gameHistoryService: GameHistoryService) {}

    @EventPattern(ECommandGameHistory.SAVE_GAME_HISTORY)
    async handleSaveGameHistory(@Payload() data): Promise<void> {
        await this.gameHistoryService.saveGameHistory(data);
    }
}
