import { ECommandChat } from '@app/common/constants/command.constant';
import {
    EFileService,
    ELoggerService,
    ERegisterMicroservice,
} from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { AFileService } from '@app/common/file/file.abstract';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

import { CreateChatRequestDto } from './dtos/create-chat-request.dto';
import { CreateChatResponseDto } from './dtos/create-chat-response.dto';
import { DeleteChatResponseDto } from './dtos/delete-response.dto';
import {
    GetChatMessageRequestDto,
    GetChatTopicRequestDto,
    GetDocumentFromVectorDbRequestDto,
} from './dtos/get-chat-request.dto';
import { GetChatMessageResponseDto, GetChatTopicResponseDto } from './dtos/get-chat-response.dto';
import { UpdateChatRequestDto } from './dtos/update-chat-request.dto';
import { UpdateChatResponseDto } from './dtos/update-chat-response.dto';

@Injectable()
export class ChatService {
    constructor(
        @Inject(ERegisterMicroservice.CHAT_SERVICE_RABBIT_MQ)
        private readonly chatService: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,
    ) {}

    async createNewChatMessage(
        createChatRequestDto: CreateChatRequestDto,
        userPayload: UserPayloadDto,
        originalFileName: string,
        stageFilePath: string,
        s3StageFilePath: string,
    ) {
        this.logger.info('Creating chat message', {
            prop: {
                createChatRequestDto,
                userPayload,
                originalFileName,
                stageFilePath,
                s3StageFilePath,
            },
        });

        let createdChatMessageResponseDto: CreateChatResponseDto;
        try {
            createdChatMessageResponseDto = await firstValueFrom(
                this.chatService
                    .send(ECommandChat.CREATE_CHAT_MESSAGE, {
                        createChatRequestDto,
                        userPayload,
                        originalFileName,
                        stageFilePath,
                        s3StageFilePath,
                    })
                    .pipe(timeout(2 * 60 * 1000)),
            );
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error creating chat message',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-chat-service-create-chat-message-#0001',
            });
        } finally {
            if (s3StageFilePath) {
                this.fileService.removeFile(s3StageFilePath);
            }
        }
        return createdChatMessageResponseDto;
    }

    async getChatMessage(
        topicId: number,
        getChatMessageRequestDto: GetChatMessageRequestDto,
        userPayload: UserPayloadDto,
    ) {
        this.logger.info('Getting chat topic by ID', {
            prop: {
                topicId,
                getChatMessageRequestDto,
                userPayload,
            },
        });

        try {
            const getChatMessageResponseDto: PaginationResponseDto<GetChatMessageResponseDto> =
                await firstValueFrom(
                    this.chatService
                        .send(ECommandChat.GET_CHAT_MESSAGES, {
                            topicId,
                            getChatMessageRequestDto,
                            userPayload,
                        })
                        .pipe(timeout(3000)),
                );

            return getChatMessageResponseDto;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting chat message',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-chat-service-get-chat-message-#0001',
            });
        }
    }

    async getChatTopic(
        getChatTopicRequestDto: GetChatTopicRequestDto,
        userPayload: UserPayloadDto,
    ) {
        this.logger.info('Getting chat topic', {
            prop: {
                getChatTopicRequestDto,
                userPayload,
            },
        });

        try {
            const getChatTopicResponseDto: PaginationResponseDto<GetChatTopicResponseDto> =
                await firstValueFrom(
                    this.chatService
                        .send(ECommandChat.GET_CHAT_TOPIC, {
                            getChatTopicRequestDto,
                            userPayload,
                        })
                        .pipe(timeout(3000)),
                );

            return getChatTopicResponseDto;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting chat topic',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-chat-service-get-chat-topic-#0001',
            });
        }
    }

    async deleteChatTopic(topicId: number, userPayload: UserPayloadDto) {
        this.logger.info('Deleting chat topic', {
            prop: {
                topicId,
                userPayload,
            },
        });

        try {
            const deleteChatResponseDto: DeleteChatResponseDto = await firstValueFrom(
                this.chatService
                    .send(ECommandChat.DELETE_CHAT_TOPIC, {
                        topicId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return deleteChatResponseDto;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error deleting chat topic',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-chat-service-delete-chat-topic-#0001',
            });
        }
    }

    async updateChatTopic(
        topicId: number,
        updateChatRequestDto: UpdateChatRequestDto,
        userPayload: UserPayloadDto,
    ) {
        this.logger.info('Updating chat topic', {
            prop: {
                topicId,
                updateChatRequestDto,
                userPayload,
            },
        });

        try {
            const updateChatResponseDto: UpdateChatResponseDto = await firstValueFrom(
                this.chatService
                    .send(ECommandChat.UPDATE_CHAT_TOPIC, {
                        topicId,
                        updateChatRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return updateChatResponseDto;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error updating chat topic',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-chat-service-update-chat-topic-#0001',
            });
        }
    }

    async getVectorDb(
        getDocumentFromVectorDbRequestDto: GetDocumentFromVectorDbRequestDto,
        userPayload: UserPayloadDto,
    ) {
        this.logger.info('Getting document from VectorDB', {
            prop: {
                getDocumentFromVectorDbRequestDto,
            },
        });

        try {
            const getVectorDbResponseDto = await firstValueFrom(
                this.chatService
                    .send(ECommandChat.GET_VECTOR_DB, {
                        getDocumentFromVectorDbRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return getVectorDbResponseDto;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting document from VectorDB',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-chat-service-get-vector-db-#0001',
            });
        }
    }
}
