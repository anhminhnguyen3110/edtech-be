import { ECommandGame } from '@app/common/constants/command.constant';
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
import { GetGameRequestDto } from './dtos/get-game-request.dto';
import { GetGameResponseDto } from './dtos/get-game-response.dto';
import { UpdateGameRequestDto } from './dtos/update-game-request.dto';
import { UpdateGameResponseDto } from './dtos/update-game.response.dto';

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

    async updateGame(
        id: Game['id'],
        updateGameRequestDto: UpdateGameRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<UpdateGameResponseDto> {
        this.logger.info('Update game', {
            prop: {
                id,
                updateGameRequestDto,
                userPayload,
            },
        });

        try {
            const response: UpdateGameResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandGame.UPDATE_GAME, {
                        id,
                        updateGameRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error update game',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-game-service-update-error-#0001',
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
}
