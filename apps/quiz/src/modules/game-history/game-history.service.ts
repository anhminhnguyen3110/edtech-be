import { EFolderName } from '@app/common/constants/s3.constant';
import { EChatService, EFileService, ELoggerService } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { AFileService } from '@app/common/file/file.abstract';
import { LanguageModelAbstract } from '@app/common/language-model/language-model.abstract';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
    GetGamesPerformanceRequestDto,
    GetPerformanceDetailRequestDto,
    GetPerformanceInsightRequestDto,
    GetPlayerPerformanceRequestDto,
} from 'apps/api/src/modules/game/dtos/get-game-history.request.dto';
import {
    GetGameDetailsResponseDto,
    GetGameHistoryDetailsResponseDto,
    GetGameHistoryPerformanceResponseDto,
    GetPerformanceDetailResponseDto,
    GetPlayerPerformanceResponseDto,
    GetPlayersAnswerForSingleQuestionGameHistoryResponseDto,
    GetPlayersAnswerGameHistoryResponseDto,
    GetPlayersAnswerWithDetailsGameHistoryResponseDto,
    GetQuestionsGameHistoryResponseDto,
    GetQuestionsPerformanceForSinglePlayerGameHistoryResponseDto,
    GetQuestionsWithDetailsGameHistoryResponseDto,
} from 'apps/api/src/modules/game/dtos/get-game-history.response.dto';
import { In } from 'typeorm';

import { GameEntity } from '../game/models/game.entity';
import { GameRepository } from '../game/models/game.repository';
import { CreateGameHistoryRequestDto } from './dtos/create-game-history.dto';
import { GameHistoryRepository } from './models/game-history.repository';

@Injectable()
export class GameHistoryService {
    constructor(
        private readonly gameHistoryRepo: GameHistoryRepository,
        private readonly gameRepo: GameRepository,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,
        @Inject(EChatService.CHAT_SERVICE)
        private readonly languageModelService: LanguageModelAbstract,
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
                        playerAnswerInDb: JSON.stringify(player.playerAnswer),
                        isCorrect: player.isCorrect,
                        pointAwarded: player.pointAwarded,
                        score: player.score,
                        strikeCount: player.strikeCount,
                        timeSubmitted: new Date(player.timeSubmitted),
                        timeSpent: player.timeSpent,
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

    async getGameHistoryDetail(data: {
        gameId: number;
        userPayload: UserPayloadDto;
    }): Promise<GetGameHistoryDetailsResponseDto> {
        this.logger.info('Getting game history detail', {
            prop: { ...data },
        });

        const { gameId, userPayload } = data;

        let game: GameEntity;
        try {
            game = await this.gameRepo.findOne({
                where: { id: gameId },
                relations: ['quiz', 'quiz.questions'],
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get game history detail',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-game-history-detail-#0001',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-game-history-detail-#0002',
            });
        }

        if (game.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-gamme-history-service-ts-get-game-history-detail-#0003',
            });
        }

        let totalPlayers: number;
        let players: any;
        let questions: any;

        try {
            const result = await this.gameHistoryRepo.getGameHistoryStats(gameId);
            totalPlayers = result.totalPlayers;
            players = result.players;
            questions = result.questions;
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get game history detail',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-game-history-detail-#0004',
            });
        }

        const response: GetGameHistoryDetailsResponseDto = new GetGameHistoryDetailsResponseDto();

        response.totalPlayers = totalPlayers;
        response.players = [];
        response.questions = [];

        players.forEach((player, index) => {
            const playerDto = new GetPlayersAnswerGameHistoryResponseDto();
            playerDto.nickname = player.nickname;
            playerDto.finalScore = player.score;
            playerDto.numberOfCorrectAnswers = parseInt(player.numberOfCorrectAnswers);
            playerDto.longestStrikeCount = player.longestStrikeCount;
            playerDto.numberOfUnansweredQuestions = parseInt(player.numberOfUnansweredQuestions);
            playerDto.numberOfWrongAnswers = parseInt(player.numberOfWrongAnswers);
            playerDto.finalRank = index + 1;
            playerDto.playerId = player.playerId;

            response.players.push(playerDto);
        });

        questions.forEach(question => {
            const questionDto = new GetQuestionsGameHistoryResponseDto();
            questionDto.questionId = question.questionId;
            questionDto.numberOfCorrectAnswers = parseInt(question.numberOfCorrectAnswers);
            questionDto.totalPlayers = totalPlayers;
            questionDto.questionText = question.questionText;
            questionDto.questionType = question.questionType;

            response.questions.push(questionDto);
        });

        response.game = new GetGameDetailsResponseDto();
        response.game.id = 10;
        response.game.gameCode = game.gameCode;
        response.game.gameStatus = game.gameStatus;
        response.game.quizId = game.quiz.id;
        response.game.quizName = game.quiz.name;
        response.game.quizClassAssignmentId = game.quiz.classAssignmentId;
        response.game.totalQuestions = game.quiz.questions.length;
        response.game.startedAt = game.createdAt.toISOString();
        response.game.endedAt = game.updatedAt.toISOString();

        return response;
    }

    async getPlayersListByGameId(data: {
        gameId: number;
        userPayload: UserPayloadDto;
    }): Promise<GetPlayersAnswerGameHistoryResponseDto[]> {
        this.logger.info('Getting players list by account ID', {
            prop: { ...data },
        });

        const { gameId, userPayload } = data;

        let game: GameEntity;

        try {
            game = await this.gameRepo.findOne({
                where: { id: gameId },
                relations: ['quiz'],
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get players list by account ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-list-by-account-id-#0001',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-list-by-account-id-#0002',
            });
        }

        if (game.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-gamme-history-service-ts-get-players-list-by-account-id-#0003',
            });
        }

        let players: any;

        try {
            players = await this.gameHistoryRepo.getPlayersByGameId(gameId);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get players list by account ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-list-by-account-id-#0004',
            });
        }

        const response: GetPlayersAnswerGameHistoryResponseDto[] = [];

        players.forEach((player, index) => {
            const playerDto = new GetPlayersAnswerGameHistoryResponseDto();
            playerDto.playerId = player.playerId;
            playerDto.nickname = player.nickname;
            playerDto.finalScore = player.score;
            playerDto.numberOfCorrectAnswers = parseInt(player.numberOfCorrectAnswers);
            playerDto.longestStrikeCount = player.longestStrikeCount;
            playerDto.numberOfUnansweredQuestions = parseInt(player.numberOfUnansweredQuestions);
            playerDto.numberOfWrongAnswers = parseInt(player.numberOfWrongAnswers);
            playerDto.finalRank = index + 1;

            response.push(playerDto);
        });

        return response;
    }

    async getQuestionsListByGameHistoryId(data: {
        gameId: number;
        userPayload: UserPayloadDto;
    }): Promise<GetQuestionsGameHistoryResponseDto[]> {
        this.logger.info('Getting questions list by game ID', {
            prop: { ...data },
        });

        const { gameId, userPayload } = data;

        let game: GameEntity;

        try {
            game = await this.gameRepo.findOne({
                where: { id: gameId },
                relations: ['quiz'],
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get questions list by game ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-questions-list-by-game-history-id-#0001',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-questions-list-by-game-history-id-#0002',
            });
        }

        if (game.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-gamme-history-service-ts-get-questions-list-by-game-history-id-#0003',
            });
        }

        let questions: any;

        try {
            questions = await this.gameHistoryRepo.getQuestionsByGameId(gameId);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get questions list by game ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-questions-list-by-game-history-id-#0004',
            });
        }

        const response: GetQuestionsGameHistoryResponseDto[] = [];

        questions.forEach(question => {
            const questionDto = new GetQuestionsGameHistoryResponseDto();
            questionDto.questionId = question.questionId;
            questionDto.numberOfCorrectAnswers = parseInt(question.numberOfCorrectAnswers);
            questionDto.totalPlayers = 10;
            questionDto.questionText = question.questionText;
            questionDto.questionType = question.questionType;

            response.push(questionDto);
        });

        return response;
    }

    async getPlayersDetailByHistoryId(data: {
        gameId: number;
        playerId: number;
        userPayload: UserPayloadDto;
    }): Promise<GetPlayersAnswerWithDetailsGameHistoryResponseDto> {
        this.logger.info('Getting players detail by game ID', {
            prop: { ...data },
        });

        const { gameId, playerId, userPayload } = data;

        let game: GameEntity;

        try {
            game = await this.gameRepo.findOne({
                where: { id: gameId },
                relations: ['quiz'],
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get players detail by game ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-detail-by-game-id-#0001',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-detail-by-game-id-#0002',
            });
        }

        if (game.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-gamme-history-service-ts-get-players-detail-by-game-id-#0003',
            });
        }

        let player: any;

        try {
            player = await this.gameHistoryRepo.getPlayerDetailByGameId(gameId, playerId);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get players detail by game ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-detail-by-game-id-#0004',
            });
        }

        const response = new GetPlayersAnswerWithDetailsGameHistoryResponseDto();

        response.nickname = player.nickname;
        response.finalScore = player.score;
        response.numberOfCorrectAnswers = parseInt(player.numberOfCorrectAnswers);
        response.longestStrikeCount = player.longestStrikeCount;
        response.numberOfUnansweredQuestions = parseInt(player.numberOfUnansweredQuestions);
        response.numberOfWrongAnswers = parseInt(player.numberOfWrongAnswers);
        response.finalRank = player.finalRank;
        response.playerId = player.playerId;

        response.questionsPerformance = [];

        player.questions.forEach(question => {
            const questionDto = new GetQuestionsPerformanceForSinglePlayerGameHistoryResponseDto();
            questionDto.questionId = question.questionId;
            questionDto.isCorrect = question.isCorrect === 1;
            questionDto.scoresGained = question.scoresGained;
            questionDto.currentNumberOfCorrectAnswers = question.currentNumberOfCorrectAnswers;
            questionDto.currentRank = question.currentRank;
            questionDto.currentScore = question.currentScore;
            questionDto.currentStrikeCount = question.currentStrikeCount;
            questionDto.timeLimitInSecond = question.timeLimitInSecond;
            questionDto.timeSubmittedInSecond = question.timeSubmittedInSecond;
            questionDto.questionText = question.questionText;
            questionDto.questionType = question.questionType;

            response.questionsPerformance.push(questionDto);
        });
        return response;
    }

    async getQuestionDetailByGameHistoryId(data: {
        gameId: number;
        questionId: number;
        userPayload: UserPayloadDto;
    }): Promise<GetQuestionsWithDetailsGameHistoryResponseDto> {
        this.logger.info('Getting question detail by game ID', {
            prop: { ...data },
        });

        const { gameId, questionId, userPayload } = data;

        let game: GameEntity;

        try {
            game = await this.gameRepo.findOne({
                where: { id: gameId },
                relations: ['quiz'],
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get question detail by game ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-question-detail-by-game-id-#0001',
            });
        }

        if (!game) {
            throw new RpcException({
                message: 'Game not found',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-question-detail-by-game-id-#0002',
            });
        }

        if (game.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-gamme-history-service-ts-get-question-detail-by-game-id-#0003',
            });
        }

        let question: any;

        try {
            question = await this.gameHistoryRepo.getQuestionDetailByGameId(gameId, questionId);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get question detail by game ID',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-question-detail-by-game-id-#0004',
            });
        }

        const response = new GetQuestionsWithDetailsGameHistoryResponseDto();

        response.questionId = question.questionId;
        response.questionText = question.questionText;
        response.questionType = question.questionType;
        response.numberOfCorrectAnswers = parseInt(question.numberOfCorrectAnswers);
        response.numberOfUnansweredQuestions = parseInt(question.numberOfUnansweredQuestions);
        response.numberOfWrongAnswers = parseInt(question.numberOfWrongAnswers);
        response.averageResponseTime = question.averageResponseTime;
        response.maxResponseTime = question.maxResponseTime;
        response.minResponseTime = question.minResponseTime;
        response.choices = JSON.parse(question.choices);
        response.correctAnswer = JSON.parse(question.correctAnswer);
        response.timeLimitInSecond = question.timeLimitInSecond;

        if (question.imageFormat) {
            response.imageUrl = await this.fileService.getSignedUrl(
                `${EFolderName.QUESTION_IMAGE}/quiz_id_${question.quizId}/question_id_${question.id}.${question.imageFormat}`,
            );
        }

        response.players = [];

        question.players.forEach(player => {
            const playerDto = new GetPlayersAnswerForSingleQuestionGameHistoryResponseDto();
            playerDto.playerId = player.playerId;
            playerDto.nickname = player.nickname;
            playerDto.isCorrect = player.isCorrect === 1;
            playerDto.playerAnswer = JSON.parse(player.playerAnswer);
            playerDto.scoresGained = player.scoresGained;
            playerDto.timeSubmittedInSecond = player.timeSubmittedInSecond;

            response.players.push(playerDto);
        });

        return response;
    }

    async getPlayersPerformancePlayerSearch(data: {
        userPayload: UserPayloadDto;
        getPlayerPerformanceRequestDto: GetPlayerPerformanceRequestDto;
    }): Promise<PaginationResponseDto<GetPlayerPerformanceResponseDto>> {
        this.logger.info('Getting players performance by player search', {
            prop: { ...data },
        });

        const { userPayload, getPlayerPerformanceRequestDto } = data;

        let players: any;
        let total: string;

        try {
            [players, total] = await this.gameHistoryRepo.getPlayersPerformanceByPlayerSearch(
                getPlayerPerformanceRequestDto,
                userPayload.id, // accountId
            );
        } catch (error) {
            throw new RpcException({
                message:
                    error.message || error || 'Failed to get players performance by player search',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-players-performance-player-search-#0001',
            });
        }

        const getPlayerPerformanceResponseDto: GetPlayerPerformanceResponseDto[] = [];

        players.forEach(player => {
            const playerDto = new GetPlayerPerformanceResponseDto();
            playerDto.nickname = player.nickname;
            playerDto.playerId = player.playerId;
            playerDto.totalGames = parseInt(player.totalGames);

            getPlayerPerformanceResponseDto.push(playerDto);
        });

        const response: PaginationResponseDto<GetPlayerPerformanceResponseDto> =
            new PaginationResponseDto<GetPlayerPerformanceResponseDto>(
                getPlayerPerformanceResponseDto,
                getPlayerPerformanceRequestDto,
                parseInt(total),
            );

        return response;
    }

    async getGamesHistoryPerformanceByNickname(data: {
        userPayload: UserPayloadDto;
        getGamesPerformanceRequestDto: GetGamesPerformanceRequestDto;
    }): Promise<GetGameHistoryPerformanceResponseDto[]> {
        this.logger.info('Getting games history performance by nickname', {
            prop: { ...data },
        });

        const { userPayload, getGamesPerformanceRequestDto } = data;

        let games: any;

        try {
            games = await this.gameHistoryRepo.getGameHistoriesByPlayerNickname(
                getGamesPerformanceRequestDto,
                userPayload.id,
            );
        } catch (error) {
            throw new RpcException({
                message:
                    error.message || error || 'Failed to get games history performance by nickname',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-games-history-performance-by-nickname-#0001',
            });
        }

        const response: GetGameHistoryPerformanceResponseDto[] = [];

        games.forEach(game => {
            const gameDto = new GetGameHistoryPerformanceResponseDto();
            gameDto.gameId = game.gameId;
            gameDto.startedAt = game.startedAt.toISOString();
            gameDto.endedAt = game.endedAt.toISOString();
            gameDto.gameCode = game.gameCode;
            gameDto.gameStatus = game.gameStatus;
            gameDto.quizName = game.quizName;

            response.push(gameDto);
        });

        return response;
    }

    async getPerformanceDetail(data: {
        userPayload: UserPayloadDto;
        getPerformanceDetailRequestDto: GetPerformanceDetailRequestDto;
    }): Promise<GetPerformanceDetailResponseDto[]> {
        this.logger.info('Getting performance detail', {
            prop: { ...data },
        });

        const { userPayload, getPerformanceDetailRequestDto } = data;

        // validate first
        const allUniqueGames = getPerformanceDetailRequestDto.playerGameRequest
            .map(playerGame => playerGame.gameId)
            .filter((value, index, self) => self.indexOf(value) === index);

        if (allUniqueGames.length !== getPerformanceDetailRequestDto.playerGameRequest.length) {
            throw new RpcException({
                message: 'Duplicate game id',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-gamme-history-service-ts-get-performance-detail-#0001',
            });
        }

        let games: GameEntity[];

        try {
            games = await this.gameRepo.find({
                where: {
                    id: In(allUniqueGames),
                },
                relations: ['quiz'],
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get performance detail',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-performance-detail-#0002',
            });
        }

        const isAuthorized = games.every(game => game.quiz.accountId === userPayload.id);

        if (!isAuthorized) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-gamme-history-service-ts-get-performance-detail-#0003',
            });
        }

        if (games.length !== getPerformanceDetailRequestDto.playerGameRequest.length) {
            const gameNotFound = getPerformanceDetailRequestDto.playerGameRequest.filter(
                playerGame => !games.some(game => game.id === playerGame.gameId),
            );

            throw new RpcException({
                message: `Game not found: ${gameNotFound.map(game => game.gameId).join(', ')}`,
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-gamme-history-service-ts-get-performance-detail-#0004',
            });
        }

        let gameInformations: any;

        try {
            gameInformations = await this.gameHistoryRepo.getGameInformationForPerformanceDetail(
                allUniqueGames,
            );
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get performance detail',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-performance-detail-#0004',
            });
        }

        const uniquePlayers = getPerformanceDetailRequestDto.playerGameRequest
            .map(playerGame => playerGame.playerNickname)
            .filter((value, index, self) => self.indexOf(value) === index);

        let performanceDetails: any;

        try {
            performanceDetails = await this.gameHistoryRepo.getPerformanceDetail(
                allUniqueGames,
                uniquePlayers,
                getPerformanceDetailRequestDto.playerGameRequest,
                userPayload.id, // accountId
            );
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Failed to get performance detail',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-gamme-history-service-ts-get-performance-detail-#0005',
            });
        }

        const gameInformationsMap = new Map();
        gameInformations.forEach(game => {
            gameInformationsMap.set(game.gameId, game);
        });

        const response: GetPerformanceDetailResponseDto[] = [];

        performanceDetails.forEach(player => {
            const playerDto = new GetPerformanceDetailResponseDto();
            playerDto.nickname = player.nickname;
            playerDto.personalScore = player.maxScore;
            playerDto.finalRank = parseInt(player.finalRank);
            playerDto.averageResponseTimePerQuestion = player.avgResponseTime;
            playerDto.numberOfCorrectAnswers = parseInt(player.numberOfCorrectAnswers);
            playerDto.longestStrikeCount = player.longestStrikeCount;
            playerDto.gameId = player.gameId;

            const gameInformation = gameInformationsMap.get(player.gameId);

            playerDto.totalQuestions = parseInt(gameInformation.totalQuestions);
            playerDto.startedAt = gameInformation.startedAt.toISOString();
            playerDto.endedAt = gameInformation.endedAt.toISOString();
            playerDto.quizName = gameInformation.quizName;
            playerDto.endedAt = gameInformation.endedAt.toISOString();
            playerDto.highestScoreInGame = gameInformation.highestScore;
            playerDto.lowestScoreInGame = gameInformation.lowestScore;
            playerDto.averageScoreInGame = parseInt(gameInformation.averageScore);
            playerDto.longestStrikeCountInGame = gameInformation.longestStrikeCount;
            playerDto.averageResponseTimePerQuestionInGame = gameInformation.averageResponseTime;
            playerDto.totalPlayers = parseInt(gameInformation.totalPlayers);

            response.push(playerDto);
        });

        return response;
    }

    async getPerformanceDetailInsight(data: {
        getPerformanceDetailInsightRequestDto: GetPerformanceInsightRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<string> {
        this.logger.info('Getting performance detail insight', {
            prop: { ...data },
        });

        const { getPerformanceDetailInsightRequestDto } = data;

        const cleanDataForModel =
            getPerformanceDetailInsightRequestDto.performanceDetailInsightRequest.map(player => {
                delete player.nickname;
                delete player.startedAt;
                delete player.endedAt;
                if (player.averageResponseTimePerQuestion < 0)
                    player.averageResponseTimePerQuestion = 0;
                return player;
            });

        const promptDesign = `You are an educator who wants to understand the performance of a single student in a recent quiz.
            You need to provide some progress insights to the student based on the his/her performance in the quiz.
            Based on the data, please provide me at max 2 paragraphs (Each paragraph should have at max 100 words) on the following:
            1 paragraph on the student's overall performance in the quiz and 1 paragraph on the student's progress from quiz to quiz and time to time.

            The historical data for the student is as follows:
            ${JSON.stringify(cleanDataForModel)}

            Please note that:
                - personalScore is the highest score the student has achieved in a quiz.
                - finalRank is the student's rank at the end of the quiz.
                - averageResponseTimePerQuestion is the average time the student took to answer a question.
                - numberOfCorrectAnswers is the number of correct answers the student has given. 
                - longestStrikeCount is the longest streak of correct answers the student has given.
                - gameId is the Identifier of the quiz the student has taken.
                - totalQuestions is the total number of questions in the quiz.
                - startedAt is the time when the quiz started.
                - endedAt is the time when the quiz ended.
                - quizName is the name of the quiz.
                - highestScoreInGame is the highest score that other student have achieved in the quiz.
                - lowestScoreInGame is the lowest score that other student have achieved in the quiz.
                - averageScoreInGame is the average score that other student have achieved in the quiz.
                - longestStrikeCountInGame is the longest streak of correct answers that other student have given in the quiz.
                - totalPlayers is the total number of students who have taken the quiz
                - averageResponseTimePerQuestionInGame is the average time that other student have taken to answer a question in the quiz.

            Please note that I need the response in a structured format and the response should be at max 2 paragraphs and each paragraph should have at max 100 words.
            Please output the response in the following JSON format:
            Output: 
            {
                "answer": ""
            }
        `;

        const response = await this.languageModelService.sendMessageToModel(promptDesign, 0.5);

        return response;
    }
}
