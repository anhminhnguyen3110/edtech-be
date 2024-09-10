import { ECommandQuestion } from '@app/common/constants/command.constant';
import {
    EFileService,
    ELoggerService,
    ERegisterMicroservice,
} from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { AFileService } from '@app/common/file/file.abstract';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { CreateQuestionRequestDto } from './dtos/create-question-request.dto';
import { CreateQuestionResponseDto } from './dtos/create-question-response.dto';
import { DeleteQuestionResponseDto } from './dtos/delete-question-response.dto';
import { UpdateQuestionRequestDto } from './dtos/update-question-request.dto';

@Injectable()
export class QuestionService {
    constructor(
        @Inject(ERegisterMicroservice.QUIZ_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,
    ) {}

    async create(
        createQuestionDto: CreateQuestionRequestDto,
        userPayload: UserPayloadDto,
        s3StageFilePath: any,
        callFromClient = true,
    ): Promise<CreateQuestionResponseDto> {
        this.logger.info('Creating question', {
            prop: {
                createQuestionDto,
                userPayload,
                s3StageFilePath,
                callFromClient,
            },
        });

        let createdQuestion: CreateQuestionResponseDto;

        try {
            createdQuestion = await firstValueFrom(
                this.httpClient
                    .send(ECommandQuestion.CREATE_QUESTION, {
                        createQuestionDto,
                        userPayload,
                        s3StageFilePath,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error creating question',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-question-service-create-error-#0001',
            } as IErrorResponseDto);
        } finally {
            if (s3StageFilePath) {
                this.fileService.removeFile(s3StageFilePath);
            }
        }

        return createdQuestion;
    }

    async update(
        id: number,
        updateQuestionDto: UpdateQuestionRequestDto,
        userPayload: UserPayloadDto,
        s3StageFilePath: any,
        callFromClient = true,
    ): Promise<void> {
        this.logger.info('Updating question', {
            prop: {
                id,
                updateQuestionDto,
                userPayload,
                s3StageFilePath,
                callFromClient,
            },
        });

        try {
            return await firstValueFrom(
                this.httpClient
                    .send(ECommandQuestion.UPDATE_QUESTION, {
                        id,
                        updateQuestionDto,
                        userPayload,
                        s3StageFilePath,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error updating question',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-question-service-update-error-#0001',
            } as IErrorResponseDto);
        } finally {
            if (s3StageFilePath) {
                this.fileService.removeFile(s3StageFilePath);
            }
        }
    }

    async remove(
        id: number,
        userPayload: UserPayloadDto,
        callFromClient = true,
    ): Promise<DeleteQuestionResponseDto> {
        this.logger.info('Removing question', {
            prop: {
                id,
                userPayload,
                callFromClient,
            },
        });

        try {
            return await firstValueFrom(
                this.httpClient
                    .send(ECommandQuestion.REMOVE_QUESTION, {
                        id,
                        userPayload,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error removing question',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-question-service-remove-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
