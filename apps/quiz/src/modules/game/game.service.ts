import { EGameRedisPrefixKey } from '@app/common/constants/cache.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import { EGameStatus } from '@app/common/constants/table.constant';
import { Game } from '@app/common/domain/game.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateGameRequestDto } from 'apps/api/src/modules/game/dtos/create-game-request.dto';
import { CreateGameResponseDto } from 'apps/api/src/modules/game/dtos/create-game-response.dto';
import { GetGameRequestDto } from 'apps/api/src/modules/game/dtos/get-game-request.dto';
import { GetGameResponseDto } from 'apps/api/src/modules/game/dtos/get-game-response.dto';
import { UpdateGameResponseDto } from 'apps/api/src/modules/game/dtos/update-game.response.dto';
import { GetQuizResponseDto } from 'apps/api/src/modules/quiz/dtos/get-quiz-response.dto';

import { QuizEntity } from '../quiz/models/quiz.entity';
import { QuizRepository } from '../quiz/models/quiz.repository';
import { QuizService } from '../quiz/quiz.service';
import { UpdateGameStatusRequestDto } from './dtos/game-gateway.dto';
import { GameRedisPayloadDto } from './dtos/game-redis-payload.dto';
import { GameEntity } from './models/game.entity';
import { GameRepository } from './models/game.repository';

@Injectable()
export class GameService {
    constructor(
        private readonly gameRepo: GameRepository,
        private readonly quizService: QuizService,
        private readonly redisService: RedisService,
        private readonly quizRepo: QuizRepository,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async createGame(data: {
        createGameRequestDto: CreateGameRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<CreateGameResponseDto> {
        this.logger.info('Data enter game microservice: Creating game', {
            prop: { ...data },
        });

        const { createGameRequestDto, userPayload } = data;

        let quiz;
        try {
            quiz = await this.quizService.findOneWithDetail({
                id: createGameRequestDto.quizId,
                getQuizDetailRequestDto: {
                    id: createGameRequestDto.quizId,
                },
                userPayload,
                callFromClient: false,
            });
        } catch (error) {
            this.logger.error('Error retrieving quiz', {
                prop: { createGameRequestDto, userPayload },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-create-error-#0003',
            });
        }

        if (!quiz) {
            throw new RpcException({
                message: 'Quiz not found',
                status: HttpStatus.NOT_FOUND,
                code: 'quiz-game-service-ts-create-error-#0001',
            });
        }

        if (quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-game-service-ts-create-error-#0002',
            });
        }

        if (quiz.questions.length === 0) {
            throw new RpcException({
                message: 'Quiz has no questions',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-game-service-ts-create-error-#0007',
            });
        }

        let latestGame: GameEntity;

        try {
            latestGame = await this.gameRepo.findLastGame();
        } catch (error) {
            this.logger.error('Error retrieving latest game', {
                prop: {
                    createGameRequestDto,
                    userPayload,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-create-error-#0004',
            });
        }

        const newGameCode = this.generateUniqueGameCode(latestGame?.id + 1 || 1, quiz.id);

        let savedGame: GameEntity;
        try {
            const newGame = new GameEntity();
            newGame.quizId = createGameRequestDto.quizId;
            newGame.gameStatus = EGameStatus.ACTIVE;
            newGame.gameCode = newGameCode;
            savedGame = await this.gameRepo.save(newGame);
        } catch (error) {
            this.logger.error('Error saving new game', {
                prop: { createGameRequestDto, userPayload },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-create-error-#0005',
            });
        }

        let index = 1;
        for (const question of quiz.questions) {
            question.questionIndexInQuiz = index;
            index += 1;
        }

        const gameRedisPayloadDto: GameRedisPayloadDto = {
            id: savedGame.id,
            status: savedGame.gameStatus,
            quiz: quiz,
            gameCode: newGameCode,
        };

        try {
            await this.redisService.set(
                `${EGameRedisPrefixKey.GameCode}_${newGameCode}`,
                gameRedisPayloadDto,
                300,
            );
        } catch (error) {
            this.logger.error('Error setting game code in Redis', {
                prop: { newGameCode, quiz },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-create-error-#0006',
            });
        }

        const response = new CreateGameResponseDto();
        response.id = savedGame.id;
        response.quizId = quiz.id;
        response.quizName = quiz.name;
        response.noQuestions = quiz.questions.length;
        response.gameCode = newGameCode;
        response.status = savedGame.gameStatus;
        return response;
    }

    async updateGameStatus(data: UpdateGameStatusRequestDto): Promise<UpdateGameResponseDto> {
        this.logger.info('Data enter game microservice: Updating game', {
            prop: { ...data },
        });

        const { gameId, status } = data;

        let game: GameEntity;
        try {
            game = await this.gameRepo.findOne({
                where: {
                    id: gameId,
                },
            });
        } catch (error) {
            this.logger.error('Error retrieving game', {
                prop: {
                    ...data,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-update-error-#0003',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.NOT_FOUND,
                code: 'quiz-game-service-ts-update-error-#0001',
            });
        }

        try {
            game.gameStatus = status;
            // Update other fields as necessary

            game = await this.gameRepo.save(game);
        } catch (error) {
            this.logger.error('Error updating game', {
                prop: {
                    ...data,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-update-error-#0004',
            });
        }

        const response = new UpdateGameResponseDto();
        response.id = game.id;
        response.quizId = game.quizId;
        response.quizName = game.quiz.name;
        response.status = game.gameStatus;
        response.gameCode = game.gameCode;

        return response;
    }

    async getGameDetail(data: {
        id: Game['id'];
        userPayload: UserPayloadDto;
    }): Promise<GetGameResponseDto> {
        this.logger.info('Data enter game microservice: Getting game detail', {
            prop: { ...data },
        });

        const { id, userPayload } = data;

        let game: GameEntity;
        try {
            game = await this.gameRepo.findOne({
                where: { id },
                relations: ['quiz', 'quiz.questions'],
            });
        } catch (error) {
            this.logger.error('Error retrieving game details', {
                prop: { id, userPayload },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-detail-error-#0003',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.NOT_FOUND,
                code: 'quiz-game-service-ts-detail-error-#0001',
            });
        }

        if (game.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-game-service-ts-detail-error-#0002',
            });
        }

        const response = new GetGameResponseDto();
        const quiz = new GetQuizResponseDto();
        quiz.id = game.quiz.id;
        quiz.name = game.quiz.name;
        quiz.description = game.quiz.description;
        quiz.classAssignmentId = game.quiz.classAssignmentId;

        response.id = game.id;
        response.quizId = game.quiz.id;
        response.quizName = game.quiz.name;
        response.status = game.gameStatus;
        response.gameCode = game.gameCode;
        response.noQuestions = game.quiz.questions.length;

        return response;
    }

    private generateUniqueGameCode(gameId: number, quizId: number): string {
        const randomDigit = Math.floor(100 + Math.random() * 900).toString();
        randomDigit.padStart(3, '0');
        return `${gameId}${quizId}${randomDigit}`;
    }

    async getGames(data: {
        getGameRequestDto: GetGameRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<PaginationResponseDto<GetGameResponseDto>> {
        this.logger.info('Data enter game microservice: Getting games', {
            prop: { ...data },
        });

        const { getGameRequestDto, userPayload } = data;
        let quiz: QuizEntity;
        if (getGameRequestDto.quizId) {
            try {
                quiz = await this.quizRepo.findOneByOrFail({
                    id: getGameRequestDto.quizId,
                });

                if (userPayload.id !== quiz.accountId) {
                    throw new RpcException({
                        message: 'Unauthorized',
                        status: HttpStatus.UNAUTHORIZED,
                        code: 'quiz-game-service-ts-get-error-#0002',
                    });
                }
            } catch (error) {
                throw new RpcException({
                    message: error.message || error || 'Quiz not found',
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: 'quiz-game-service-ts-get-error-#0001',
                });
            }
        }

        let games: GameEntity[];
        let total: number;
        try {
            [games, total] = await this.gameRepo.paginateGames(userPayload.id, getGameRequestDto);
        } catch (error) {
            this.logger.error('Error retrieving games', {
                prop: { getGameRequestDto, userPayload },
                error,
            });

            throw new RpcException({
                message: error.message || error,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-game-service-ts-get-error-#0003',
            });
        }

        const getGameResponseDto: GetGameResponseDto[] = games.map(game => {
            const response = new GetGameResponseDto();
            response.id = game.id;
            response.quizId = game.quiz.id;
            response.quizName = game.quiz.name;
            response.gameCode = game.gameCode;
            response.startedAt = game.createdAt;
            response.status = game.gameStatus;
            response.noQuestions = game.quiz.questions.length;
            response.noPlayers = [
                ...new Set(game.gameHistories.map(history => history.playerId)),
            ].length;

            return response;
        });

        return new PaginationResponseDto<GetGameResponseDto>(
            getGameResponseDto,
            getGameRequestDto,
            total,
        );
    }
}
