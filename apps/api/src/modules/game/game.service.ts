import { ECommandGame, ECommandGameHistory } from '@app/common/constants/command.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { Game } from '@app/common/domain/game.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { CreateNotificationRequestDto } from '../notification/dtos/create-notification-request.dto';
import { NotificationService } from '../notification/notification.service';
import { CreateGameRequestDto } from './dtos/create-game-request.dto';
import { CreateGameResponseDto } from './dtos/create-game-response.dto';
import {
    GetGamesPerformanceRequestDto,
    GetPerformanceDetailRequestDto,
    GetPerformanceInsightRequestDto,
    GetPlayerPerformanceRequestDto,
} from './dtos/get-game-history.request.dto';
import {
    GetGameHistoryDetailsResponseDto,
    GetGameHistoryPerformanceResponseDto,
    GetPerformanceDetailResponseDto,
    GetPlayerPerformanceResponseDto,
    GetPlayersAnswerGameHistoryResponseDto,
    GetPlayersAnswerWithDetailsGameHistoryResponseDto,
    GetQuestionsGameHistoryResponseDto,
    GetQuestionsWithDetailsGameHistoryResponseDto,
} from './dtos/get-game-history.response.dto';
import { GetGameRequestDto } from './dtos/get-game-request.dto';
import { GetGameResponseDto } from './dtos/get-game-response.dto';

@Injectable()
export class GameService {
    constructor(
        @Inject(ERegisterMicroservice.QUIZ_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        private readonly notificationService: NotificationService,
    ) {}

    async createGame(
        createGameRequestDto: CreateGameRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<CreateGameResponseDto> {
        this.logger.info('Creating game', {
            prop: {
                createGameRequestDto,
                userPayload,
            },
        });

        try {
            const createdGame: CreateGameResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandGame.CREATE_GAME, {
                        createGameRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Game ${createdGame.gameCode} has been created with ${createdGame.noQuestions} questions`,
                eventType: ENotificationEventType.CREATE_GAME,
            };

            this.notificationService.createNotification(
                createNotificationRequestDto,
                userPayload.id,
            );

            return createdGame;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error creating game',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-create-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getGameDetail(id: Game['id'], userPayload: UserPayloadDto): Promise<GetGameResponseDto> {
        this.logger.info('Getting game detail', {
            prop: { id },
        });

        try {
            const gameDetail: GetGameResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandGame.GET_GAME_DETAIL, { id, userPayload })
                    .pipe(timeout(3000)),
            );

            return gameDetail;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting game detail',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-detail-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getGames(
        getGameRequestDto: GetGameRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<PaginationResponseDto<GetGameResponseDto>> {
        this.logger.info('Getting games', {
            prop: { getGameRequestDto, userPayload },
        });

        try {
            const games: PaginationResponseDto<GetGameResponseDto> = await firstValueFrom(
                this.httpClient
                    .send(ECommandGame.GET_GAMES, {
                        getGameRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );
            return games;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting games',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-games-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getGameHistoryDetail(
        gameId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetGameHistoryDetailsResponseDto> {
        this.logger.info('Getting game history detail', {
            prop: { gameId, userPayload },
        });

        try {
            const gameHistoryDetail: GetGameHistoryDetailsResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_GAME_HISTORY_DETAIL, {
                        gameId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return gameHistoryDetail;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting game history detail',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-history-detail-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getPlayersListByGameHistoryId(
        gameId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetPlayersAnswerGameHistoryResponseDto[]> {
        this.logger.info('Getting players by game history ID', {
            prop: { gameId, userPayload },
        });

        try {
            const players: GetPlayersAnswerGameHistoryResponseDto[] = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_PLAYERS_BY_GAME_ID, {
                        gameId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return players;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting players by game history ID',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-players-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getQuestionsListByGameHistoryId(
        gameId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetQuestionsGameHistoryResponseDto[]> {
        this.logger.info('Getting questions by game history ID', {
            prop: { gameId, userPayload },
        });

        try {
            const questions: GetQuestionsGameHistoryResponseDto[] = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_QUESTIONS_BY_GAME_ID, {
                        gameId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return questions;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting questions by game history ID',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-questions-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getPlayersPerformanceSearchPlayer(
        userPayload: UserPayloadDto,
        getPlayerPerformanceRequestDto: GetPlayerPerformanceRequestDto,
    ): Promise<PaginationResponseDto<GetPlayerPerformanceResponseDto>> {
        this.logger.info('Getting players performance', {
            prop: { userPayload, getPlayerPerformanceRequestDto },
        });

        try {
            const playersPerformance: PaginationResponseDto<GetPlayerPerformanceResponseDto> =
                await firstValueFrom(
                    this.httpClient
                        .send(ECommandGameHistory.GET_PLAYERS_PERFORMANCE_PLAYER_SEARCH, {
                            userPayload,
                            getPlayerPerformanceRequestDto,
                        })
                        .pipe(timeout(3000)),
                );

            return playersPerformance;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting players performance',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-players-performance-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getQuestionDetailByGameHistoryId(
        gameId: number,
        questionId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetQuestionsWithDetailsGameHistoryResponseDto> {
        this.logger.info('Getting question by game history ID', {
            prop: { gameId, questionId, userPayload },
        });

        try {
            const question: GetQuestionsWithDetailsGameHistoryResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_QUESTION_DETAIL_BY_GAME_ID, {
                        gameId,
                        questionId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return question;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting question by game history ID',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-question-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getPlayerDetailByGameHistoryId(
        gameId: number,
        playerId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetPlayersAnswerWithDetailsGameHistoryResponseDto> {
        this.logger.info('Getting player by game history ID', {
            prop: { gameId, playerId, userPayload },
        });

        try {
            const player: GetPlayersAnswerWithDetailsGameHistoryResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_PLAYER_DETAIL_BY_GAME_ID, {
                        gameId,
                        playerId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return player;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting player by game history ID',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-player-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getGamesHistoryPerformanceByNickname(
        userPayload: UserPayloadDto,
        getGamesPerformanceRequestDto: GetGamesPerformanceRequestDto,
    ): Promise<GetGameHistoryPerformanceResponseDto[]> {
        this.logger.info('Getting players performance by game', {
            prop: { userPayload, getGamesPerformanceRequestDto },
        });

        try {
            const playersPerformance: GetGameHistoryPerformanceResponseDto[] = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_GAME_HISTORY_PERFORMANCE_BY_NICKNAME, {
                        userPayload,
                        getGamesPerformanceRequestDto,
                    })
                    .pipe(timeout(3000)),
            );

            return playersPerformance;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting players performance by game',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-players-performance-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getPerformanceDetail(
        userPayload: UserPayloadDto,
        getPerformanceDetailRequestDto: GetPerformanceDetailRequestDto,
    ): Promise<GetPerformanceDetailResponseDto[]> {
        this.logger.info('Getting performance detail', {
            prop: { userPayload, getPerformanceDetailRequestDto },
        });

        try {
            const performanceDetail: GetPerformanceDetailResponseDto[] = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_PERFORMANCE_DETAIL, {
                        userPayload,
                        getPerformanceDetailRequestDto,
                    })
                    .pipe(timeout(3000)),
            );

            return performanceDetail;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting performance detail',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-performance-detail-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getPerformanceInsight(
        getPerformanceDetailInsightRequestDto: GetPerformanceInsightRequestDto,
        userPayload: UserPayloadDto,
    ) {
        this.logger.info('Getting performance insight', {
            prop: { getPerformanceDetailInsightRequestDto, userPayload },
        });

        try {
            const performanceInsight: string = await firstValueFrom(
                this.httpClient
                    .send(ECommandGameHistory.GET_PERFORMANCE_INSIGHT, {
                        userPayload,
                        getPerformanceDetailInsightRequestDto,
                    })
                    .pipe(timeout(60000)),
            );

            return performanceInsight;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting performance insight',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-get-performance-insight-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
