import { EGameRedisPrefixKey, EGameRole } from '@app/common/constants/cache.constant';
import { ECommandGame, ECommandGameHistory } from '@app/common/constants/command.constant';
import { ENamespace } from '@app/common/constants/route.constants';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { EGameStatus } from '@app/common/constants/table.constant';
import { EWebsocketGameMessage } from '@app/common/constants/ws.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { RedisService } from '@app/common/redis/redis.service';
import { Inject, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { GetQuestionResponseDto } from 'apps/api/src/modules/question/dtos/get-question-response.dto';
import * as moment from 'moment';
import { Lock } from 'redlock';
import { Server, Socket } from 'socket.io';

import { configuration } from '../../config/validate/config.validate';
import { CreateGameHistoryRequestDto } from '../game-history/dtos/create-game-history.dto';
import {
    GetClientResponseDto,
    UpdateGameStatusRequestDto,
    WsAnswerSubmittedRequestDto,
    WsAnswerSubmittedResponseDto,
    WsGetQuestionResponseDto,
    WsHostEndGameRequestDto,
    WsHostGetQuestionRequestDto,
    WsHostJoinRequestDto,
    WsHostProceedToNextQuestionRequestDto,
    WsHostProceedToNextQuestionResponseDto,
    WsHostStartGameRequestDto,
    WsPlayerJoinRequestDto,
    WsPlayerJoinResponseDto,
    WsQuestionHostResultDto,
    WsQuestionPlayerResultDto,
    WsQuizRankResponseDto,
    WsUpdatePlayersInLobbyDto,
} from './dtos/game-gateway.dto';
import { GameRedisPayloadDto } from './dtos/game-redis-payload.dto';
import { GetPlayerResponseDto, GetPlayersAnswerResponseDto } from './dtos/get-player-response.dto';
import { GameHelperService } from './game.helper';

@WebSocketGateway(configuration().QUIZ_WS_PORT, {
    namespace: ENamespace.GAME,
})
@UsePipes(new ValidationPipe({ transform: true }))
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly redisService: RedisService,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @Inject(ERegisterMicroservice.QUIZ_SERVICE_RABBIT_MQ)
        private readonly gameServiceClient: ClientProxy,
        private readonly gameHelperService: GameHelperService,
    ) {}

    async handleConnection(client: Socket): Promise<void> {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        this.logger.debug(`Client disconnected: ${client.id}`);

        const clientKey = `${EGameRedisPrefixKey.Client}_${client.id}`;
        const clientInfo: GetClientResponseDto = await this.redisService.get(clientKey);

        if (!clientInfo) {
            return;
        }

        const { gameCode, role } = clientInfo;
        const gameKey = `${EGameRedisPrefixKey.GameCode}_${gameCode}`;
        const playersKey = `${EGameRedisPrefixKey.GamePlayers}_${gameCode}`;
        const lockKey = `${EGameRedisPrefixKey.Lock}_${gameKey}`;
        const lockPlayersKey = `${EGameRedisPrefixKey.Lock}_${playersKey}`;

        let lock: Lock;
        let lockPlayers: Lock;

        try {
            // Acquire a lock based on role
            lock = await this.redisService.lock(lockKey);

            if (role === EGameRole.Host) {
                const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

                if (game) {
                    const players: GetPlayerResponseDto[] = await this.redisService.get(playersKey);

                    if (game.status !== EGameStatus.COMPLETED) {
                        game.status = EGameStatus.TERMINATED;
                        game.hostClientId = null;
                        await this.redisService.set(gameKey, game);

                        this.gameServiceClient.emit(ECommandGame.UPDATE_GAME_STATUS, {
                            gameId: game.id,
                            status: EGameStatus.TERMINATED,
                        } as UpdateGameStatusRequestDto);
                    }

                    await this.redisService.del(playersKey);
                    this.server.to(gameCode).emit(EWebsocketGameMessage.HOST_DISCONNECTED, {
                        message: 'Host disconnected',
                    });

                    for (const player of players) {
                        await this.redisService.del(
                            `${EGameRedisPrefixKey.Client}_${player.clientRedisId}`,
                        );
                    }

                    // Disconnect all players
                    const sockets = await this.server.in(gameCode).fetchSockets();
                    for (const socket of sockets) {
                        if (socket.id !== client.id) {
                            socket.disconnect(true);
                        }
                    }

                    // Delete all game related keys
                    await this.redisService.del(gameKey);
                    await this.redisService.del(playersKey);
                    await this.redisService.del(clientKey);
                }
            } else {
                // Player disconnect
                lockPlayers = await this.redisService.lock(lockPlayersKey);
                const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

                if (!game) {
                    this.redisService.del(clientKey);
                    return;
                }

                if (game.status === EGameStatus.ACTIVE) {
                    const players: GetPlayerResponseDto[] = await this.redisService.get(playersKey);

                    const updatedPlayers: GetPlayerResponseDto[] =
                        players?.filter(player => player.clientRedisId !== client.id) || [];

                    await this.redisService.set(playersKey, updatedPlayers);

                    this.server.to(gameCode).emit(EWebsocketGameMessage.UPDATE_PLAYERS_IN_LOBBY, {
                        players: updatedPlayers,
                        playersCount: updatedPlayers.length,
                    } as WsUpdatePlayersInLobbyDto);

                    await this.redisService.del(clientKey);
                }
            }
        } catch (error) {
            this.logger.error(error);
        } finally {
            if (lock) {
                try {
                    await this.redisService.unlock(lock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
            if (lockPlayers) {
                try {
                    await this.redisService.unlock(lockPlayers);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.HOST_JOINED)
    async handleHostJoined(client: Socket, data: WsHostJoinRequestDto): Promise<void> {
        const gameKey = `${EGameRedisPrefixKey.GameCode}_${data.gameCode}`;
        const lockKey = `${EGameRedisPrefixKey.Lock}_${gameKey}`;

        let lock: Lock;

        try {
            // Acquire a lock for the game
            lock = await this.redisService.lock(lockKey);

            const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

            if (game === null || !game) {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND, {
                    message: 'Game not found',
                    gameCode: data.gameCode,
                });
                return;
            }

            if (game.status === EGameStatus.COMPLETED) {
                client.emit(EWebsocketGameMessage.GAME_ALREADY_COMPLETED, {
                    message: 'Game already completed',
                    gameCode: data.gameCode,
                });
                return;
            }

            if (game.hostClientId) {
                client.emit(EWebsocketGameMessage.HOST_ALREADY_JOINED, {
                    message: 'Host already joined',
                });
                return;
            }

            game.hostClientId = client.id;
            await this.redisService.set(gameKey, game);

            const oldClientKeys: string[] = await this.redisService.getKeysWithPrefix(
                `${EGameRedisPrefixKey.Client}_*`,
            );

            const oldClientKeysFiltered = (
                await Promise.all(
                    oldClientKeys.map(async key => {
                        return {
                            key,
                            gameCode: (await this.redisService.get(key))?.gameCode,
                        };
                    }),
                )
            ).filter(clientInfo => clientInfo && clientInfo.gameCode === data.gameCode);

            // Delete old clients
            await Promise.all(
                oldClientKeysFiltered.map(async clientInfo => {
                    await this.redisService.del(clientInfo.key);
                }),
            );

            await this.redisService.set(`${EGameRedisPrefixKey.Client}_${client.id}`, {
                gameCode: data.gameCode,
                role: EGameRole.Host,
            });

            await this.redisService.set(`${EGameRedisPrefixKey.GamePlayers}_${data.gameCode}`, []);

            client.join(data.gameCode);

            client.emit(EWebsocketGameMessage.HOST_JOINED_SUCCESSFULLY, {
                message: 'Host joined successfully',
                gameCode: data.gameCode,
            });
        } catch (error) {
            this.logger.error(error);
            client.emit(EWebsocketGameMessage.ERROR, error);
        } finally {
            if (lock) {
                try {
                    await this.redisService.unlock(lock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.PLAYER_JOINED)
    async handlePlayerJoined(client: Socket, data: WsPlayerJoinRequestDto): Promise<void> {
        const gameKey = `${EGameRedisPrefixKey.GameCode}_${data.gameCode}`;
        const playersKey = `${EGameRedisPrefixKey.GamePlayers}_${data.gameCode}`;
        const clientKey = `${EGameRedisPrefixKey.Client}_${client.id}`;
        const lockKey = `${EGameRedisPrefixKey.Lock}_${playersKey}`;
        let lock: Lock;

        try {
            lock = await this.redisService.lock(lockKey);

            const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

            if (!game) {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND, {
                    message: 'Game not found',
                    gameCode: data.gameCode,
                });
                return;
            }

            if (!game.hostClientId) {
                client.emit(EWebsocketGameMessage.HOST_NOT_JOIN_YET, {
                    message: 'Host not join yet',
                    gameCode: data.gameCode,
                });
                return;
            }

            if (game.status !== EGameStatus.ACTIVE) {
                client.emit(EWebsocketGameMessage.GAME_ALREADY_STARTED, {
                    message: 'Game already started, player cannot join',
                    gameCode: data.gameCode,
                });
                return;
            }

            const players: GetPlayerResponseDto[] = (await this.redisService.get(playersKey)) || [];

            if (players.find(p => p.nickname === data.nickname)) {
                client.emit(EWebsocketGameMessage.PLAYER_NICKNAME_TAKEN, {
                    message: 'Nickname already taken',
                    gameCode: data.gameCode,
                    nickname: data.nickname,
                });
                return;
            }

            const newPlayer: GetPlayerResponseDto = {
                clientRedisId: client.id,
                playerId: (players.length || 0) + 1,
                nickname: data.nickname,
                score: 0,
                strikeCount: 0,
                numberOfCorrectAnswers: 0,
                recentAnswerQuestion: null,
                rank: 0,
                gameCode: data.gameCode,
            };

            players.push(newPlayer);

            await this.redisService.set(playersKey, players);
            await this.redisService.set(clientKey, newPlayer);

            client.join(data.gameCode);

            client.emit(EWebsocketGameMessage.PLAYER_JOINED_SUCCESSFULLY, {
                nickname: newPlayer.nickname,
                gameCode: data.gameCode,
                playerId: newPlayer.playerId,
            } as WsPlayerJoinResponseDto);

            this.server.to(data.gameCode).emit(EWebsocketGameMessage.UPDATE_PLAYERS_IN_LOBBY, {
                players: players,
                playersCount: players.length,
            } as WsUpdatePlayersInLobbyDto);
        } catch (error) {
            this.logger.error(error);
            client.emit(EWebsocketGameMessage.ERROR, error);
        } finally {
            if (lock) {
                try {
                    await this.redisService.unlock(lock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.HOST_STARTED_GAME)
    async handleHostStartedGame(client: Socket, data: WsHostStartGameRequestDto): Promise<void> {
        const gameKey = `${EGameRedisPrefixKey.GameCode}_${data.gameCode}`;
        const lockKey = `${EGameRedisPrefixKey.Lock}_${gameKey}`;
        const playersKey = `${EGameRedisPrefixKey.GamePlayers}_${data.gameCode}`;
        const playersLockKey = `${EGameRedisPrefixKey.Lock}_${playersKey}`;

        let lock: Lock;
        let playersLock: Lock;

        try {
            // Acquire a lock for the game
            lock = await this.redisService.lock(lockKey);
            playersLock = await this.redisService.lock(playersLockKey);

            const game: GameRedisPayloadDto = await this.redisService.get(gameKey);
            const players: GetPlayerResponseDto[] = await this.redisService.get(playersKey);
            if (game) {
                if (!game.hostClientId) {
                    client.emit(EWebsocketGameMessage.HOST_NOT_JOIN_YET, {
                        message: 'Host not join yet',
                        gameCode: data.gameCode,
                    });
                    return;
                }

                if (game.hostClientId !== client.id) {
                    client.emit(EWebsocketGameMessage.NOT_HOST, 'Only host can start the game');
                    return;
                }

                if (game.status !== EGameStatus.ACTIVE) {
                    client.emit(EWebsocketGameMessage.GAME_ALREADY_STARTED, {
                        message: 'Game already started',
                        gameCode: data.gameCode,
                    });
                    return;
                }

                if (players.length < 1) {
                    client.emit(EWebsocketGameMessage.NOT_ENOUGH_PLAYERS, {
                        message: 'Not enough players to start the game',
                        gameCode: data.gameCode,
                    });
                    return;
                }

                game.status = EGameStatus.STARTED;
                await this.redisService.set(gameKey, game);

                this.server.to(data.gameCode).emit(EWebsocketGameMessage.GAME_HAS_STARTED, {
                    message: 'Game has started',
                    gameCode: data.gameCode,
                });
            } else {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND, {
                    message: 'Game not found',
                    gameCode: data.gameCode,
                });
            }
        } catch (error) {
            this.logger.error(error);
            client.emit(EWebsocketGameMessage.ERROR, error);
        } finally {
            if (lock) {
                try {
                    await this.redisService.unlock(lock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }

            if (playersLock) {
                try {
                    await this.redisService.unlock(playersLock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.HOST_GET_QUESTION)
    async handleGetQuestion(client: Socket, data: WsHostGetQuestionRequestDto): Promise<void> {
        const { gameCode, questionIndexInQuiz, delayTimeInSeconds } = data;

        const gameKey = `${EGameRedisPrefixKey.GameCode}_${gameCode}`;

        const lockKey = `${EGameRedisPrefixKey.Lock}_${gameKey}`;
        let lock: Lock;

        try {
            // Acquire a lock for the game
            lock = await this.redisService.lock(lockKey);
            const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

            if (!game) {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND, {
                    message: 'Game not found',
                    gameCode,
                });
                return;
            }

            if (game.hostClientId !== client.id) {
                client.emit(EWebsocketGameMessage.NOT_HOST, 'Only host can get the question');
                return;
            }

            if (game.status !== EGameStatus.STARTED) {
                client.emit(EWebsocketGameMessage.GAME_NOT_STARTED, {
                    message: 'Game not started',
                    gameCode,
                });
                return;
            }

            let nextQuestion: GetQuestionResponseDto;
            if (questionIndexInQuiz > game.quiz.questions.length) {
                game.status = EGameStatus.COMPLETED;
                await this.redisService.set(gameKey, game);
                this.server.to(gameCode).emit(EWebsocketGameMessage.GAME_END, {
                    message: 'Game has ended',
                    gameCode,
                });
                this.gameServiceClient.emit(ECommandGame.UPDATE_GAME_STATUS, {
                    gameId: game.id,
                    status: EGameStatus.COMPLETED,
                } as UpdateGameStatusRequestDto);
                return;
            } else {
                nextQuestion = game.quiz.questions[questionIndexInQuiz];
            }

            if (!nextQuestion) {
                game.status = EGameStatus.COMPLETED;
                await this.redisService.set(gameKey, game);
                this.server.to(gameCode).emit(EWebsocketGameMessage.GAME_END, {
                    message: 'Game has ended',
                    gameCode,
                });
                this.gameServiceClient.emit(ECommandGame.UPDATE_GAME_STATUS, {
                    gameId: game.id,
                    status: EGameStatus.COMPLETED,
                } as UpdateGameStatusRequestDto);
                return;
            }

            const releaseTimeUtc = moment.utc().add(delayTimeInSeconds, 'seconds').toISOString();
            game.questionStartTime = releaseTimeUtc;
            await this.redisService.set(gameKey, game);

            if (nextQuestion) delete nextQuestion.correctAnswers;

            const hostData: WsGetQuestionResponseDto = {
                ...nextQuestion,
                questionIndexInQuiz: questionIndexInQuiz,
                timeQuestionStart: releaseTimeUtc,
            };

            client.emit(EWebsocketGameMessage.HOST_RECEIVE_QUESTION_DETAIL, hostData);

            this.server
                .to(gameCode)
                .emit(EWebsocketGameMessage.PLAYER_RECEIVE_QUESTION_OPTIONS, hostData);
        } catch (error) {
            this.logger.error(error);
            client.emit(
                EWebsocketGameMessage.ERROR,
                'An error occurred while getting the question',
            );
        } finally {
            if (lock) {
                try {
                    await this.redisService.unlock(lock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.ANSWER_SUBMITTED)
    async handleAnswerSubmitted(client: Socket, data: WsAnswerSubmittedRequestDto): Promise<void> {
        const { gameCode, questionIndexInQuiz, answer, timeSubmitted, timeZoneOffset } = data;

        const playerAnswer = answer;

        const gameKey = `${EGameRedisPrefixKey.GameCode}_${gameCode}`;
        const clientKey = `${EGameRedisPrefixKey.Client}_${client.id}`;
        const lockKey = `${EGameRedisPrefixKey.Lock}_${clientKey}`;

        let lock: Lock;
        try {
            const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

            if (!game) {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND, {
                    message: 'Game not found',
                    gameCode,
                });
                return;
            }

            if (game.status !== EGameStatus.STARTED) {
                client.emit(EWebsocketGameMessage.GAME_NOT_STARTED, {
                    message: 'Game not started',
                    gameCode,
                });
                return;
            }

            const question: GetQuestionResponseDto = game.quiz.questions[questionIndexInQuiz];

            if (!question) {
                client.emit(EWebsocketGameMessage.QUESTION_NOT_FOUND, {
                    message: 'Question not found',
                    gameCode,
                    questionIndexInQuiz,
                });
                return;
            }

            lock = await this.redisService.lock(lockKey);
            const player: GetPlayerResponseDto = await this.redisService.get(clientKey);

            if (!player) {
                client.emit(EWebsocketGameMessage.PLAYER_NOT_FOUND, {
                    message: 'Player not found',
                    gameCode,
                    playerId: client.id,
                });
                return;
            }

            if (player.recentAnswerQuestion) {
                client.emit(EWebsocketGameMessage.ANSWER_ALREADY_SUBMITTED, {
                    message: 'Answer already submitted',
                    gameCode,
                    playerId: client.id,
                    playerAnswer: player.recentAnswerQuestion.playerAnswer,
                });
                return;
            }

            const submittedTime: Date = timeSubmitted
                ? moment(timeSubmitted).utcOffset(timeZoneOffset).toDate()
                : moment().toDate();

            player.recentAnswerQuestion = {
                questionIndexInQuiz,
                playerAnswer,
                timeSubmitted: submittedTime || new Date(),
                timeSpent:
                    moment(submittedTime).diff(game.questionStartTime, 'milliseconds') / 1000,
                pointAwarded: 0,
                isCorrect: false,
            };

            await this.redisService.set(clientKey, player);

            client.emit(EWebsocketGameMessage.ANSWER_SUBMITTED_SUCCESSFULLY, {
                playerId: player.playerId,
                submittedTime: submittedTime,
            } as WsAnswerSubmittedResponseDto);

            this.server.to(gameCode).emit(EWebsocketGameMessage.UPDATE_PLAYERS_ANSWERED, {
                playerId: player.playerId,
                submittedTime: submittedTime,
            } as WsAnswerSubmittedResponseDto);
        } catch (error) {
            this.logger.error(error);
            client.emit(EWebsocketGameMessage.ERROR, error);
        } finally {
            if (lock) {
                try {
                    await this.redisService.unlock(lock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.QUESTION_END)
    async handleQuestionEnd(client: Socket, data: WsHostEndGameRequestDto): Promise<void> {
        const { gameCode, questionIndexInQuiz } = data;

        const gameKey = `${EGameRedisPrefixKey.GameCode}_${gameCode}`;
        const playersKey = `${EGameRedisPrefixKey.GamePlayers}_${gameCode}`;
        const gameLockKey = `${EGameRedisPrefixKey.Lock}_${gameKey}`;
        const playersLockKey = `${EGameRedisPrefixKey.Lock}_${playersKey}`;

        let gameLock: Lock;
        let playersLock: Lock;
        const clientLocks: { [key: string]: Lock } = {};

        let gameHistory: CreateGameHistoryRequestDto;

        try {
            gameLock = await this.redisService.lock(gameLockKey);
            playersLock = await this.redisService.lock(playersLockKey);
            const game: GameRedisPayloadDto = await this.redisService.get(gameKey);

            if (!game) {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND, {
                    message: 'Game not found',
                    gameCode,
                });
                return;
            }

            if (game.hostClientId !== client.id) {
                client.emit(EWebsocketGameMessage.NOT_HOST, 'Only host can end the question');
                return;
            }

            if (game.status !== EGameStatus.STARTED) {
                client.emit(EWebsocketGameMessage.GAME_NOT_STARTED, {
                    message: 'Game not started',
                    gameCode,
                });
                return;
            }

            const playersClientKey: GetPlayerResponseDto[] = await this.redisService.get(
                playersKey,
            );

            const playersKeyList = playersClientKey.map(
                player => `${EGameRedisPrefixKey.Client}_${player.clientRedisId}`,
            );

            let players: GetPlayerResponseDto[] = await Promise.all(
                playersKeyList.map(async key => {
                    const lock = await this.redisService.lock(`${EGameRedisPrefixKey.Lock}_${key}`); // Lock each player's client key
                    clientLocks[key] = lock;
                    return await this.redisService.get(key);
                }),
            );

            const question: GetQuestionResponseDto = game.quiz.questions[questionIndexInQuiz];
            if (!question) {
                client.emit(EWebsocketGameMessage.QUESTION_NOT_FOUND, {
                    message: 'Question not found',
                    gameCode,
                    questionIndexInQuiz,
                });
                return;
            }

            const isCorrects = players.map(player =>
                this.gameHelperService.checkAnswer(
                    question,
                    player.recentAnswerQuestion?.playerAnswer ?? [],
                ),
            );

            players = this.gameHelperService.calculateScore(players, isCorrects);

            const playersAnswered: GetPlayersAnswerResponseDto[] = players.map((player, _) => {
                return {
                    ...player,
                    ...player.recentAnswerQuestion,
                };
            });

            players.forEach(async player => {
                player.recentAnswerQuestion = null;
                await this.redisService.set(
                    `${EGameRedisPrefixKey.Client}_${player.clientRedisId}`,
                    player,
                );
            });

            // Emit QuestionResult event
            const questionStatistic = this.gameHelperService.generateQuestionStatistic(
                playersAnswered,
                question,
            );

            const questionResultData: WsQuestionHostResultDto = {
                correctAnswer: question.correctAnswers,
                questionIndexInQuiz,
                questionStatistic,
            };
            client.emit(EWebsocketGameMessage.QUESTION_HOST_RESULT, questionResultData);

            // Emit QuestionPlayerResult event
            const questionPlayerResultData: WsQuestionPlayerResultDto[] = playersAnswered.map(
                player => ({
                    playerId: player.playerId,
                    isCorrect: player.isCorrect,
                    pointAwarded: player.pointAwarded,
                    strikeCount: player.strikeCount,
                    timeSubmitted: player.timeSubmitted,
                    timeSpent: player.timeSpent,
                    currentScore: player.score,
                    rank: player.rank,
                }),
            );

            this.server
                .to(gameCode)
                .emit(EWebsocketGameMessage.QUESTION_PLAYER_RESULT, questionPlayerResultData);

            // Emit QuizRank event
            const quizRankData: WsQuizRankResponseDto[] = players.map(player => ({
                playerId: player.playerId,
                playerNickname: player.nickname,
                playerScore: player.score,
                playerRank: player.rank,
            }));

            client.emit(EWebsocketGameMessage.QUIZ_HOST_RANK, quizRankData);

            gameHistory = {
                questionId: question.id,
                gameId: game.id,
                playersAnswered: playersAnswered,
            };
        } catch (error) {
            this.logger.error(error);
            client.emit(EWebsocketGameMessage.ERROR, error);
        } finally {
            if (gameLock) {
                try {
                    await this.redisService.unlock(gameLock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }

            if (playersLock) {
                try {
                    await this.redisService.unlock(playersLock);
                } catch (unlockError) {
                    this.logger.error(unlockError);
                }
            }

            for (const key in clientLocks) {
                if (clientLocks[key]) {
                    try {
                        await this.redisService.unlock(clientLocks[key]);
                    } catch (unlockError) {
                        this.logger.error(unlockError);
                    }
                }
            }
        }

        try {
            if (gameHistory) {
                this.gameServiceClient.emit(ECommandGameHistory.SAVE_GAME_HISTORY, gameHistory);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    @SubscribeMessage(EWebsocketGameMessage.PROCEED_TO_NEXT_QUESTION)
    async handleProceedToNextQuestion(
        client: Socket,
        data: WsHostProceedToNextQuestionRequestDto,
    ): Promise<void> {
        try {
            const gameKey = `${EGameRedisPrefixKey.GameCode}_${data.gameCode}`;
            const game = await this.redisService.get(gameKey);

            if (!game) {
                client.emit(EWebsocketGameMessage.GAME_NOT_FOUND);
                return;
            }

            if (game.hostClientId !== client.id) {
                client.emit(
                    EWebsocketGameMessage.NOT_HOST,
                    'Only host can proceed to the next question',
                );
                return;
            }

            if (game.status !== EGameStatus.STARTED) {
                client.emit(EWebsocketGameMessage.GAME_NOT_STARTED, {
                    message: 'Game not started',
                    gameCode: data.gameCode,
                });
                return;
            }

            this.server.to(data.gameCode).emit(EWebsocketGameMessage.MOVE_PLAYER_TO_NEXT_QUESTION, {
                message: 'Proceed to next question',
                questionIndexInQuiz: data.questionIndexInQuiz,
            } as WsHostProceedToNextQuestionResponseDto);
        } catch (error) {
            this.logger.error(error);
            client.emit(
                EWebsocketGameMessage.ERROR,
                'An error occurred while proceeding to the next question',
            );
        }
    }
}
