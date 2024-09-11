import {
    ECommandClass,
    ECommandIssue,
    ECommandNotification,
} from '@app/common/constants/command.constant';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { Question } from '@app/common/domain/question.domain';
import { Quiz } from '@app/common/domain/quiz.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { InjectQueue } from '@nestjs/bull';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { GetClassDetailResponseDto } from 'apps/api/src/modules/class/dtos/get-class-response.dto';
import { GetIssueResponseDto } from 'apps/api/src/modules/issue/dtos/get-issue-response.dto';
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import { GetQuestionResponseDto } from 'apps/api/src/modules/question/dtos/get-question-response.dto';
import {
    CreateQuizRequestDto,
    GenerateQuizRequestDto,
} from 'apps/api/src/modules/quiz/dtos/create-quiz-request.dto';
import { CreateQuizResponseDto } from 'apps/api/src/modules/quiz/dtos/create-quiz-response.dto';
import { DeleteQuizResponseDto } from 'apps/api/src/modules/quiz/dtos/delete-quiz-response.dto';
import {
    GetQuizDetailRequestDto,
    GetQuizRequestDto,
} from 'apps/api/src/modules/quiz/dtos/get-quiz-request.dto';
import {
    GetQuizDetailResponseDto,
    GetQuizResponseDto,
} from 'apps/api/src/modules/quiz/dtos/get-quiz-response.dto';
import { UpdateQuizRequestDto } from 'apps/api/src/modules/quiz/dtos/update-quiz-request.dto';
import { UpdateQuizResponseDto } from 'apps/api/src/modules/quiz/dtos/update-quiz-response.dto';
import { Queue } from 'bull';
import { firstValueFrom, timeout } from 'rxjs';

import { QuestionEntity } from '../question/models/question.entity';
import { QuestionService } from '../question/question.service';
import {
    mapCreateQuizRequestDtoToQuizEntity,
    mapEntityToGetQuizResponseDto,
    mapQuizEntityToCreateQuizResponseDto,
    mapQuizEntityToQuizDomain,
    mapUpdateQuizRequestDtoToQuizEntity,
} from './mappers/quiz.mapper';
import { QuizEntity } from './models/quiz.entity';
import { QuizRepository } from './models/quiz.repository';

@Injectable()
export class QuizService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @InjectQueue(EBullQueue.GENERATE_QUIZ_QUEUE)
        private readonly generateQuizQueue: Queue,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,

        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly assignmentService: ClientProxy,

        // Repository
        private readonly quizRepo: QuizRepository,
        private readonly questionService: QuestionService,
    ) {}

    async create(data: {
        createQuizRequestDto: CreateQuizRequestDto;
        userPayload: UserPayloadDto;
        callFromClient: boolean;
    }): Promise<Quiz | CreateQuizResponseDto> {
        this.logger.info('Data enter quiz microservice: Creating quiz', {
            prop: { ...data },
        });

        const { createQuizRequestDto, userPayload, callFromClient } = data;
        const newQuiz = mapCreateQuizRequestDtoToQuizEntity(createQuizRequestDto, userPayload);

        try {
            const savedQuiz = await this.quizRepo.save(newQuiz);

            if (!callFromClient) {
                return mapQuizEntityToQuizDomain(savedQuiz);
            } else {
                return mapQuizEntityToCreateQuizResponseDto(savedQuiz);
            }
        } catch (error) {
            this.logger.error('Error creating quiz', {
                prop: {
                    createQuizRequestDto,
                    userPayload,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-quiz-service-ts-create-error-#0001',
            });
        }
    }

    async findAll(data: {
        getQuizRequestDto: GetQuizRequestDto;
        userPayload: UserPayloadDto;
        callFromClient: boolean;
    }): Promise<PaginationResponseDto<Quiz> | PaginationResponseDto<GetQuizResponseDto>> {
        this.logger.info('Data enter quiz microservice: Finding all quizzes', {
            prop: { ...data },
        });

        const { getQuizRequestDto, userPayload, callFromClient } = data;
        getQuizRequestDto.accountId = userPayload.id;

        try {
            const [quizzesEntity, total]: [QuizEntity[], number] = await this.quizRepo.getQuizzes(
                getQuizRequestDto,
            );

            if (!callFromClient) {
                const quizzes: Quiz[] = quizzesEntity.map(mapQuizEntityToQuizDomain);
                return new PaginationResponseDto<Quiz>(quizzes, getQuizRequestDto, total);
            } else {
                const quizzes: GetQuizResponseDto[] = quizzesEntity.map(
                    mapEntityToGetQuizResponseDto,
                );
                return new PaginationResponseDto<GetQuizResponseDto>(
                    quizzes,
                    getQuizRequestDto,
                    total,
                );
            }
        } catch (error) {
            this.logger.error('Error finding all quizzes', {
                prop: {
                    getQuizRequestDto,
                    userPayload,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-quiz-service-ts-findAll-error-#0001',
            });
        }
    }

    async findOneWithDetail(data: {
        id: Quiz['id'];
        getQuizDetailRequestDto: GetQuizDetailRequestDto;
        userPayload: UserPayloadDto;
        callFromClient: boolean;
    }): Promise<Quiz | GetQuizDetailResponseDto> {
        this.logger.info('Data enter quiz microservice: Finding one quiz with detail', {
            prop: { ...data },
        });

        const { id, userPayload, callFromClient } = data;

        let quizEntity: QuizEntity;
        try {
            quizEntity = await this.quizRepo.findOne({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-quiz-service-ts-findOneWithDetail-error-#0001',
            });
        }

        if (!quizEntity) {
            throw new RpcException({
                message: 'Quiz not found',
                status: HttpStatus.NOT_FOUND,
                code: 'quiz-quiz-service-ts-findOneWithDetail-error-#0002',
            });
        }

        if (quizEntity.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-quiz-service-ts-findOneWithDetail-error-#0003',
            });
        }

        const questions: GetQuestionResponseDto[] = await this.questionService.getQuestions(id);

        try {
            if (!callFromClient) {
                const quiz: Quiz = new Quiz();
                quiz.id = quizEntity.id;
                quiz.name = quizEntity.name;
                quiz.description = quizEntity.description;
                quiz.classAssignmentId = quizEntity.classAssignmentId;
                quiz.createdAt = quizEntity.createdAt;
                quiz.updatedAt = quizEntity.updatedAt;
                quiz.classAssignmentId = quizEntity.classAssignmentId;
                quiz.accountId = quizEntity.accountId;
                quiz.questions = questions.map(question => {
                    const questionDomain: Question = new Question();
                    Object.assign(questionDomain, question);
                    return questionDomain;
                });
                return quiz;
            } else {
                const quizDetail: GetQuizDetailResponseDto = new GetQuizDetailResponseDto();
                quizDetail.id = quizEntity.id;
                quizDetail.name = quizEntity.name;
                quizDetail.description = quizEntity.description;
                quizDetail.classAssignmentId = quizEntity.classAssignmentId;
                quizDetail.questions = questions;
                quizDetail.totalQuestions = questions.length;
                return quizDetail;
            }
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-quiz-service-ts-findOneWithDetail-error-#0004',
            });
        }
    }

    async update(data: {
        id: Quiz['id'];
        updateQuizRequestDto: UpdateQuizRequestDto;
        userPayload: UserPayloadDto;
        callFromClient: boolean;
    }): Promise<Quiz | UpdateQuizResponseDto> {
        this.logger.info('Data enter quiz microservice: Updating quiz', {
            prop: { ...data },
        });

        const { id, updateQuizRequestDto, userPayload, callFromClient } = data;

        try {
            const quizEntity = await this.quizRepo.findOne({
                where: {
                    id: id,
                    accountId: userPayload.id,
                },
                relations: ['questions'],
            });

            if (!quizEntity) {
                throw new RpcException({
                    message: 'Quiz not found',
                    status: HttpStatus.NOT_FOUND,
                    code: 'quiz-quiz-service-ts-update-error-#0001',
                });
            }

            if (quizEntity.accountId !== userPayload.id) {
                throw new RpcException({
                    message: 'Unauthorized',
                    status: HttpStatus.UNAUTHORIZED,
                    code: 'quiz-quiz-service-ts-update-error-#0002',
                });
            }

            const updatedQuizEntity = mapUpdateQuizRequestDtoToQuizEntity(
                updateQuizRequestDto,
                quizEntity,
            );
            const updatedQuiz = await this.quizRepo.save(updatedQuizEntity);

            if (!callFromClient) {
                return mapQuizEntityToQuizDomain(updatedQuiz);
            } else {
                return mapEntityToGetQuizResponseDto(updatedQuiz);
            }
        } catch (error) {
            this.logger.error('Error updating quiz', {
                prop: {
                    id,
                    updateQuizRequestDto,
                    userPayload,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-quiz-service-ts-update-error-#0003',
            });
        }
    }

    async remove(data: {
        id: Quiz['id'];
        userPayload: UserPayloadDto;
        callFromClient: boolean;
    }): Promise<DeleteQuizResponseDto> {
        this.logger.info('Data enter quiz microservice: Removing quiz', {
            prop: { ...data },
        });

        const { id, userPayload } = data;

        try {
            const quizEntity = await this.quizRepo.findOne({
                where: {
                    id: id,
                    accountId: userPayload.id,
                },
            });

            const response: DeleteQuizResponseDto = new DeleteQuizResponseDto();

            if (!quizEntity) {
                response.message = 'Quiz not found';
                return response;
            }

            if (quizEntity.accountId !== userPayload.id) {
                throw new RpcException({
                    message: 'Unauthorized',
                    status: HttpStatus.UNAUTHORIZED,
                    code: 'quiz-quiz-service-ts-remove-error-#0001',
                });
            }

            await this.questionService.removeQuiz(quizEntity.id);
            await this.quizRepo.remove(quizEntity);

            response.message = 'Quiz removed successfully';
            return response;
        } catch (error) {
            this.logger.error('Error removing quiz', {
                prop: {
                    id,
                    userPayload,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'quiz-quiz-service-ts-remove-error-#0002',
            });
        }
    }

    async generateQuiz(data: {
        generateQuizRequestDto: GenerateQuizRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<void> {
        const { generateQuizRequestDto, userPayload } = data;

        this.logger.info('Data enter quiz microservice: Generating quiz', {
            prop: { ...data },
        });

        let issues: GetIssueResponseDto[];

        if (generateQuizRequestDto.classAssignmentId) {
            try {
                issues = await firstValueFrom(
                    this.assignmentService
                        .send(ECommandIssue.FIND_ALL_ISSUES, {
                            classAssignmentId: generateQuizRequestDto.classAssignmentId,
                            userPayload: userPayload,
                        })
                        .pipe(timeout(3000)),
                );
            } catch (error) {
                this.logger.error(error.message || error || 'Internal server error');

                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message:
                        ((error.message || error || 'Internal server error') as string) +
                        `with class assignment id: ${generateQuizRequestDto.classAssignmentId} while generating quiz`,
                    eventType: ENotificationEventType.GENERATE_QUIZ_FAILED,
                    classAssignmentId: generateQuizRequestDto.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: userPayload.id,
                });

                return;
            }

            if (!issues || issues.length === 0) {
                this.logger.error('No issues found');

                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message: `No issues found with class assignment id: ${generateQuizRequestDto.classAssignmentId} while generating quiz`,
                    eventType: ENotificationEventType.GENERATE_QUIZ_FAILED,
                    classAssignmentId: generateQuizRequestDto.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: userPayload.id,
                });
                return;
            }

            generateQuizRequestDto.issues = issues.map(issue => {
                const getIssueResponseDto = new GetIssueResponseDto();
                getIssueResponseDto.id = issue.id;
                getIssueResponseDto.name = issue.name;
                getIssueResponseDto.description = issue.description;
                getIssueResponseDto.studentCount = issue.studentCount;
                getIssueResponseDto.studentRate = issue.studentRate;
                getIssueResponseDto.classAssignmentId = issue.classAssignmentId;
                return getIssueResponseDto;
            });

            let classAssignmentResponse: GetClassDetailResponseDto;

            try {
                classAssignmentResponse = await firstValueFrom(
                    this.assignmentService
                        .send(ECommandClass.FIND_ONE_CLASS, {
                            classAssignmentId: generateQuizRequestDto.classAssignmentId,
                            userPayload: userPayload,
                        })
                        .pipe(timeout(3000)),
                );
            } catch (error) {
                this.logger.error(error.message || error || 'Internal server error');
                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message:
                        ((error.message || error || 'Internal server error') as string) +
                        `with class assignment id: ${generateQuizRequestDto.classAssignmentId} while generating quiz`,
                    eventType: ENotificationEventType.GENERATE_QUIZ_FAILED,
                    classAssignmentId: generateQuizRequestDto.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: userPayload.id,
                });
            }

            generateQuizRequestDto.year = classAssignmentResponse.year;

            if (generateQuizRequestDto.year) {
                generateQuizRequestDto.year = generateQuizRequestDto.year.replace('YEAR', 'GRADE');
                generateQuizRequestDto.year += '/12';
            }
        }

        generateQuizRequestDto.accountId = userPayload.id;
        this.generateQuizQueue.add(EBullQueueMessage.GENERATE_QUIZ, generateQuizRequestDto);
    }

    async saveGenerateQuiz(data: { generateQuizRequestDto: GenerateQuizRequestDto }) {
        this.logger.info('Data enter quiz microservice: Saving generated quiz', {
            prop: {
                prompt: data.generateQuizRequestDto.prompt,
            },
        });

        const { generateQuizRequestDto } = data;

        const queryRunner = await this.quizRepo.getQueryRunner();

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const quizEntity = new QuizEntity();
            quizEntity.name = generateQuizRequestDto.quiz.name;
            quizEntity.description = generateQuizRequestDto.quiz.description;
            quizEntity.classAssignmentId = generateQuizRequestDto.quiz.classAssignmentId;
            quizEntity.accountId = generateQuizRequestDto.accountId;

            quizEntity.questions = generateQuizRequestDto.questions.map(question => {
                const questionEntity = new QuestionEntity();
                questionEntity.questionText = question.questionText;
                questionEntity.questionType = question.questionType;
                questionEntity.choices = question.choices;
                questionEntity.correctAnswers = question.correctAnswers;
                questionEntity.timeLimitInSecond = question.timeLimitInSecond;
                questionEntity.quiz = quizEntity;
                return questionEntity;
            });

            await queryRunner.manager.save(quizEntity);
            await queryRunner.commitTransaction();
        } catch (error) {
            this.logger.error(error.message || error || 'Internal server error');
            await queryRunner.rollbackTransaction();

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Internal server error') as string) +
                    `with prompt ${generateQuizRequestDto.prompt} while saving generated quiz`,
                eventType: ENotificationEventType.GENERATE_QUIZ_FAILED,
                classAssignmentId: generateQuizRequestDto.classAssignmentId
                    ? generateQuizRequestDto.classAssignmentId
                    : undefined,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: generateQuizRequestDto.accountId,
            });
        } finally {
            await queryRunner.release();
        }

        const createNotificationRequestDto: CreateNotificationRequestDto = {
            message: `Quiz generated successfully quiz name: ${generateQuizRequestDto.quiz.name}`,
            eventType: ENotificationEventType.GENERATE_QUIZ_SUCCESS,
            classAssignmentId: generateQuizRequestDto.classAssignmentId
                ? generateQuizRequestDto.classAssignmentId
                : undefined,
        };

        this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
            createNotificationRequestDto,
            accountId: generateQuizRequestDto.accountId,
        });
    }
}
