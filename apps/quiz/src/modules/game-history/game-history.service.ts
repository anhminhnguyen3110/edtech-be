import { ELoggerService } from '@app/common/constants/service.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { Inject, Injectable } from '@nestjs/common';

import { CreateGameHistoryRequestDto } from './dtos/create-game-history.dto';
import { GameHistoryRepository } from './models/game-history.repository';

@Injectable()
export class GameHistoryService {
    constructor(
        private readonly gameHistoryRepo: GameHistoryRepository,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async saveGameHistory(data: CreateGameHistoryRequestDto): Promise<void> {
        const { gameId, questionId, playersAnswered } = data;

        const queryRunner = await this.gameHistoryRepo.getQueryRunner();
        await queryRunner.connect();

        try {
            await queryRunner.startTransaction();

            for (const player of playersAnswered) {
                try {
                    this.gameHistoryRepo.save({
                        gameId,
                        playerId: player.playerId,
                        questionId,
                        playerAnswer: player.playerAnswer,
                        isCorrect: player.isCorrect,
                        pointAwarded: player.pointAwarded,
                        score: player.score,
                        strikeCount: player.strikeCount,
                        timeSubmitted: new Date(player.timeSubmitted),
                        nickname: player.nickname,
                        numberOfCorrectAnswers: player.numberOfCorrectAnswers,
                        rank: player.rank,
                    });
                } catch (error) {
                    this.logger.error(
                        `Failed to save game history for player ${player.playerId}`,
                        error,
                    );
                    throw error; // Re-throw error to trigger transaction rollback
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Transaction failed. Rolling back.', error);
        } finally {
            await queryRunner.release();
        }
    }
}
