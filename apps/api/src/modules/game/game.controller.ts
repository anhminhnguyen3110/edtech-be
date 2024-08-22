import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Body, Get, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { CreateGameRequestDto } from './dtos/create-game-request.dto';
import { CreateGameResponseDto } from './dtos/create-game-response.dto';
import { GetGameRequestDto } from './dtos/get-game-request.dto';
import { GetGameResponseDto } from './dtos/get-game-response.dto';
import { UpdateGameRequestDto } from './dtos/update-game-request.dto';
import { UpdateGameResponseDto } from './dtos/update-game.response.dto';
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

    @Patch(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Update a game',
        response: UpdateGameResponseDto,
    })
    async updateGame(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateGameRequestDto: UpdateGameRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.Game}_${userPayload.id}_`;
        await this.redisService.delPatternSpecific(cacheKey);

        return this.gameService.updateGame(+id, updateGameRequestDto, userPayload);
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
        const cacheKey = `${EApiRoute.Game}_${userPayload.id}_${JSON.stringify(getGameRequestDto)}`;
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) return cachedData;

        const response = await this.gameService.getGames(getGameRequestDto, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }
}
