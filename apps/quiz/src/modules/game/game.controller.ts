import { ECommandGame } from '@app/common/constants/command.constant';
import { Game } from '@app/common/domain/game.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateGameRequestDto } from 'apps/api/src/modules/game/dtos/create-game-request.dto';
import { GetGameRequestDto } from 'apps/api/src/modules/game/dtos/get-game-request.dto';
import { UpdateGameRequestDto } from 'apps/api/src/modules/game/dtos/update-game-request.dto';

import { GameService } from './game.service';

@Controller()
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @MessagePattern(ECommandGame.CREATE_GAME)
    async createGame(
        @Payload()
        data: {
            createGameRequestDto: CreateGameRequestDto;
            userPayload: UserPayloadDto;
        },
    ) {
        return await this.gameService.createGame(data);
    }

    @MessagePattern(ECommandGame.UPDATE_GAME)
    async updateGameStatus(
        @Payload()
        data: {
            id: Game['id'];
            updateGameRequestDto: UpdateGameRequestDto;
            userPayload: UserPayloadDto;
        },
    ) {
        return await this.gameService.updateGame(data);
    }

    @MessagePattern(ECommandGame.GET_GAME_DETAIL)
    async getGameDetail(
        @Payload()
        data: {
            id: Game['id'];
            userPayload: UserPayloadDto;
        },
    ) {
        return await this.gameService.getGameDetail(data);
    }

    @MessagePattern(ECommandGame.GET_GAMES)
    async getGames(
        @Payload()
        data: {
            getGameRequestDto: GetGameRequestDto;
            userPayload: UserPayloadDto;
        },
    ) {
        return await this.gameService.getGames(data);
    }
}
