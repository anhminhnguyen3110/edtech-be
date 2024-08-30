import { ECommandQuiz } from '@app/common/constants/command.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { Quiz } from '@app/common/domain/quiz.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { CreateQuizRequestDto, GenerateQuizRequestDto } from './dtos/create-quiz-request.dto';
import { CreateQuizResponseDto, GenerateQuizResponseDto } from './dtos/create-quiz-response.dto';
import { DeleteQuizResponseDto } from './dtos/delete-quiz-response.dto';
import { GetQuizDetailRequestDto, GetQuizRequestDto } from './dtos/get-quiz-request.dto';
import { GetQuizResponseDto } from './dtos/get-quiz-response.dto';
import { UpdateQuizRequestDto } from './dtos/update-quiz-request.dto';
import { UpdateQuizResponseDto } from './dtos/update-quiz-response.dto';

@Injectable()
export class QuizService {
    constructor(
        @Inject(ERegisterMicroservice.QUIZ_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async create(
        createQuizRequestDto: CreateQuizRequestDto,
        userPayload: UserPayloadDto,
        callFromClient = true,
    ): Promise<CreateQuizResponseDto> {
        this.logger.info('Creating quiz', {
            prop: {
                createQuizRequestDto,
                userPayload,
                callFromClient,
            },
        });

        try {
            const createdQuiz: CreateQuizResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandQuiz.CREATE_QUIZ, {
                        createQuizRequestDto,
                        userPayload,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );

            return createdQuiz;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error creating quiz',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-quiz-service-create-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async findAll(
        getQuizRequestDto: GetQuizRequestDto,
        userPayload: UserPayloadDto,
        callFromClient = true,
    ): Promise<GetQuizResponseDto[]> {
        this.logger.info('Finding all quizzes', {
            prop: {
                getQuizRequestDto,
                userPayload,
                callFromClient,
            },
        });

        try {
            const quizzes: GetQuizResponseDto[] = await firstValueFrom(
                this.httpClient
                    .send(ECommandQuiz.FIND_ALL_QUIZZES, {
                        getQuizRequestDto,
                        userPayload,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );

            return quizzes;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error retrieving quizzes',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-quiz-service-find-all-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async findOneWithDetail(
        id: Quiz['id'],
        getQuizDetailRequestDto: GetQuizDetailRequestDto,
        userPayload: UserPayloadDto,
        callFromClient = true,
    ): Promise<GetQuizResponseDto> {
        this.logger.info('Finding one quiz', {
            prop: {
                id,
                getQuizDetailRequestDto,
                userPayload,
                callFromClient,
            },
        });

        try {
            const quiz: GetQuizResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandQuiz.FIND_ONE_QUIZ, {
                        id,
                        getQuizDetailRequestDto,
                        userPayload,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );

            return quiz;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error retrieving quiz',
                statusCode: HttpStatus.NOT_FOUND,
                code: error.code || 'api-quiz-service-find-one-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async update(
        id: Quiz['id'],
        updateQuizRequestDto: UpdateQuizRequestDto,
        userPayload: UserPayloadDto,
        callFromClient = true,
    ): Promise<UpdateQuizResponseDto> {
        this.logger.info('Updating quiz', {
            prop: {
                id,
                updateQuizRequestDto,
                userPayload,
                callFromClient,
            },
        });

        try {
            const response = await firstValueFrom(
                this.httpClient
                    .send(ECommandQuiz.UPDATE_QUIZ, {
                        id,
                        updateQuizRequestDto,
                        userPayload,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );

            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error updating quiz',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-quiz-service-update-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async remove(
        id: Quiz['id'],
        userPayload: UserPayloadDto,
        callFromClient = true,
    ): Promise<DeleteQuizResponseDto> {
        this.logger.info('Removing quiz', {
            prop: {
                id,
                userPayload,
                callFromClient,
            },
        });

        try {
            const response = await firstValueFrom(
                this.httpClient
                    .send(ECommandQuiz.REMOVE_QUIZ, {
                        id,
                        userPayload,
                        callFromClient,
                    })
                    .pipe(timeout(3000)),
            );

            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error removing quiz',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-quiz-service-remove-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async generateQuiz(
        generateQuizRequestDto: GenerateQuizRequestDto,
        userPayload: UserPayloadDto,
    ) {
        this.logger.info('Generating quiz', {
            prop: {
                generateQuizRequestDto,
                userPayload,
            },
        });

        try {
            this.httpClient
                .emit(ECommandQuiz.GENERATE_QUIZ, {
                    generateQuizRequestDto,
                    userPayload,
                })
                .pipe(timeout(3000));

            const response = new GenerateQuizResponseDto();

            response.message =
                'Quiz generating is being run in the background, please wait for 3-5 minutes. In the meantime, you can do other things.';

            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error generating quiz',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-quiz-service-generate-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
