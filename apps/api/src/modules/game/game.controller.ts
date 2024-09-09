import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Body, Get, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
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
import { GameService } from './game.service';

@ApiSwaggerController({
    name: EApiRoute.Game,
})
@RestrictToTeacher()
export class GameController {
    constructor(
        private readonly gameService: GameService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Create a game',
        response: CreateGameResponseDto,
    })
    async createGame(
        @Body() createGameRequestDto: CreateGameRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_${userPayload.id}_`;
        await this.redisService.delPatternSpecific(cacheKey);

        return this.gameService.createGame(createGameRequestDto, userPayload);
    }

    @Get(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get a game by ID',
        response: GetGameResponseDto, // Replace with the appropriate response DTO if different
    })
    async getGameDetail(
        @Param('id', ParseIntPipe) id: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_${userPayload.id}_${id}`;
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) return cachedData;

        const response = await this.gameService.getGameDetail(+id, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get()
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get all games',
        response: PaginationResponseDto<GetGameResponseDto>,
    })
    async getGames(
        @Query() getGameRequestDto: GetGameRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const response = await this.gameService.getGames(getGameRequestDto, userPayload);

        return response;
    }

    @Get('/game-history/:gameId')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get detail information of a game history by ID',
        response: GetGameHistoryDetailsResponseDto,
    })
    async getGameHistoryDetail(
        @Param('gameId', ParseIntPipe) gameId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ): Promise<GetGameHistoryDetailsResponseDto> {
        const cacheKey = `${EApiRoute.Game}_history_${userPayload.id}_getGameHistoryDetail_${gameId}`;
        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response: GetGameHistoryDetailsResponseDto =
            await this.gameService.getGameHistoryDetail(gameId, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get('/game-history/:gameId/players-list')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get players belong to a game',
        response: [GetPlayersAnswerGameHistoryResponseDto],
    })
    async getPlayersListByGameHistoryId(
        @Param('gameId', ParseIntPipe) gameId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${userPayload.id}_getPlayersListByGameHistoryId_${gameId}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response: GetPlayersAnswerGameHistoryResponseDto[] =
            await this.gameService.getPlayersListByGameHistoryId(gameId, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get('/game-history/:gameId/questions-list')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get questions list belong to a game',
        response: [GetQuestionsGameHistoryResponseDto],
    })
    async getQuestionsListByGameHistoryId(
        @Query('gameId', ParseIntPipe) gameId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${userPayload.id}_getQuestionsListByGameHistoryId_${gameId}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response: GetQuestionsGameHistoryResponseDto[] =
            await this.gameService.getQuestionsListByGameHistoryId(gameId, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get('/game-history/:gameId/players/:playerId')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get player details in a game',
        response: GetPlayersAnswerWithDetailsGameHistoryResponseDto,
    })
    async getPlayerByGameHistoryId(
        @Param('gameId', ParseIntPipe) gameId: number,
        @Param('playerId', ParseIntPipe) playerId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${userPayload.id}_getPlayerByGameHistoryId_${gameId}_${playerId}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response: GetPlayersAnswerWithDetailsGameHistoryResponseDto =
            await this.gameService.getPlayerDetailByGameHistoryId(gameId, playerId, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get('/game-history/:gameId/questions/:questionId')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get question details in a game',
        response: GetQuestionsWithDetailsGameHistoryResponseDto,
    })
    async getQuestionByGameHistoryId(
        @Param('gameId', ParseIntPipe) gameId: number,
        @Param('questionId', ParseIntPipe) questionId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${userPayload.id}_getQuestionByGameHistoryId_${gameId}_${questionId}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response: GetQuestionsWithDetailsGameHistoryResponseDto =
            await this.gameService.getQuestionDetailByGameHistoryId(
                gameId,
                questionId,
                userPayload,
            );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get('/game-history/performance/players')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get players by account ID',
        response: PaginationResponseDto<GetPlayerPerformanceResponseDto>,
    })
    async getPlayersPerformanceSearchPlayer(
        @UserPayload() userPayload: UserPayloadDto,
        @Query() getPlayerPerformanceRequestDto: GetPlayerPerformanceRequestDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${
            userPayload.id
        }_searchPlayerPerformance_${JSON.stringify(getPlayerPerformanceRequestDto)}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response = await this.gameService.getPlayersPerformanceSearchPlayer(
            userPayload,
            getPlayerPerformanceRequestDto,
        );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get('/game-history/performance/games')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get games histories by player nickname',
        response: [GetGameHistoryPerformanceResponseDto],
    })
    async getGamesHistoryPerformanceByNickname(
        @UserPayload() userPayload: UserPayloadDto,
        @Query() getGamesPerformanceRequestDto: GetGamesPerformanceRequestDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${
            userPayload.id
        }_searchGamePerformance_${JSON.stringify(getGamesPerformanceRequestDto)}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response = await this.gameService.getGamesHistoryPerformanceByNickname(
            userPayload,
            getGamesPerformanceRequestDto,
        );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Post('/game-history/performance/detail')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get players performance',
        response: [GetPerformanceDetailResponseDto],
    })
    async getPerformanceDetail(
        @UserPayload() userPayload: UserPayloadDto,
        @Body() getPerformanceDetailRequestDto: GetPerformanceDetailRequestDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${
            userPayload.id
        }_getPerformanceDetail_${JSON.stringify(getPerformanceDetailRequestDto)}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response: GetPerformanceDetailResponseDto[] =
            await this.gameService.getPerformanceDetail(
                userPayload,
                getPerformanceDetailRequestDto,
            );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Post('/game-history/performance/detail/insight')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get players performance insight',
        response: String,
    })
    async getPerformanceInsight(
        @Body() getPerformanceDetailInsightRequestDto: GetPerformanceInsightRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_history_${
            userPayload.id
        }_getPerformanceInsight_${JSON.stringify(getPerformanceDetailInsightRequestDto)}`;

        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) return cachedData;

        const response = await this.gameService.getPerformanceInsight(
            getPerformanceDetailInsightRequestDto,
            userPayload,
        );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }
}
