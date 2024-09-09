import { ECommandGameHistory } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
    GetGamesPerformanceRequestDto,
    GetPerformanceDetailRequestDto,
    GetPerformanceInsightRequestDto,
    GetPlayerPerformanceRequestDto,
} from 'apps/api/src/modules/game/dtos/get-game-history.request.dto';
import {
    GetGameHistoryDetailsResponseDto,
    GetGameHistoryPerformanceResponseDto,
    GetPerformanceDetailResponseDto,
    GetPlayerPerformanceResponseDto,
    GetPlayersAnswerGameHistoryResponseDto,
    GetPlayersAnswerWithDetailsGameHistoryResponseDto,
    GetQuestionsGameHistoryResponseDto,
    GetQuestionsWithDetailsGameHistoryResponseDto,
} from 'apps/api/src/modules/game/dtos/get-game-history.response.dto';

import { GameHistoryService } from './game-history.service';

@Controller()
export class GameHistoryController {
    constructor(private readonly gameHistoryService: GameHistoryService) {}

    @EventPattern(ECommandGameHistory.SAVE_GAME_HISTORY)
    async handleSaveGameHistory(@Payload() data): Promise<void> {
        await this.gameHistoryService.saveGameHistory(data);
    }

    @EventPattern(ECommandGameHistory.GET_GAME_HISTORY_DETAIL)
    async handleGetGameHistoryDetail(
        @Payload() data: { gameId: number; userPayload: UserPayloadDto },
    ): Promise<GetGameHistoryDetailsResponseDto> {
        return this.gameHistoryService.getGameHistoryDetail(data);
    }

    @EventPattern(ECommandGameHistory.GET_PLAYERS_BY_GAME_ID)
    async handleGetPlayersByHistoryId(
        @Payload() data: { gameId: number; userPayload: UserPayloadDto },
    ): Promise<GetPlayersAnswerGameHistoryResponseDto[]> {
        return await this.gameHistoryService.getPlayersListByGameId(data);
    }

    @EventPattern(ECommandGameHistory.GET_QUESTIONS_BY_GAME_ID)
    async handleGetQuestionsByGameHistoryId(
        @Payload() data: { gameId: number; userPayload: UserPayloadDto },
    ): Promise<GetQuestionsGameHistoryResponseDto[]> {
        return await this.gameHistoryService.getQuestionsListByGameHistoryId(data);
    }

    @EventPattern(ECommandGameHistory.GET_PLAYER_DETAIL_BY_GAME_ID)
    async handleGetPlayersDetailByHistoryId(
        @Payload() data: { gameId: number; playerId: number; userPayload: UserPayloadDto },
    ): Promise<GetPlayersAnswerWithDetailsGameHistoryResponseDto> {
        return await this.gameHistoryService.getPlayersDetailByHistoryId(data);
    }

    @EventPattern(ECommandGameHistory.GET_QUESTION_DETAIL_BY_GAME_ID)
    async handleGetQuestionDetailByGameHistoryId(
        @Payload() data: { gameId: number; questionId: number; userPayload: UserPayloadDto },
    ): Promise<GetQuestionsWithDetailsGameHistoryResponseDto> {
        return await this.gameHistoryService.getQuestionDetailByGameHistoryId(data);
    }

    @EventPattern(ECommandGameHistory.GET_PLAYERS_PERFORMANCE_PLAYER_SEARCH)
    async handleGetPlayersPerformancePlayerSearch(
        @Payload()
        data: {
            userPayload: UserPayloadDto;
            getPlayerPerformanceRequestDto: GetPlayerPerformanceRequestDto;
        },
    ): Promise<PaginationResponseDto<GetPlayerPerformanceResponseDto>> {
        return await this.gameHistoryService.getPlayersPerformancePlayerSearch(data);
    }

    @EventPattern(ECommandGameHistory.GET_GAME_HISTORY_PERFORMANCE_BY_NICKNAME)
    async handleGetPlayersPerformanceGameSearch(
        @Payload()
        data: {
            userPayload: UserPayloadDto;
            getGamesPerformanceRequestDto: GetGamesPerformanceRequestDto;
        },
    ): Promise<GetGameHistoryPerformanceResponseDto[]> {
        return await this.gameHistoryService.getGamesHistoryPerformanceByNickname(data);
    }

    @EventPattern(ECommandGameHistory.GET_PERFORMANCE_DETAIL)
    async handleGetPerformanceDetail(
        @Payload()
        data: {
            userPayload: UserPayloadDto;
            getPerformanceDetailRequestDto: GetPerformanceDetailRequestDto;
        },
    ): Promise<GetPerformanceDetailResponseDto[]> {
        return await this.gameHistoryService.getPerformanceDetail(data);
    }

    @EventPattern(ECommandGameHistory.GET_PERFORMANCE_INSIGHT)
    async handleGetPerformanceDetailInsight(
        @Payload()
        data: {
            getPerformanceDetailInsightRequestDto: GetPerformanceInsightRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<string> {
        return await this.gameHistoryService.getPerformanceDetailInsight(data);
    }
}
