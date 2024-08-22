import { EFolderName } from '@app/common/constants/s3.constant';
import { EFileService, ELoggerService } from '@app/common/constants/service.constant';
import { Question } from '@app/common/domain/question.domain';
import { Quiz } from '@app/common/domain/quiz.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { AFileService } from '@app/common/file/file.abstract';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { CreateQuestionRequestDto } from 'apps/api/src/modules/question/dtos/create-question-request.dto';
import { CreateQuestionResponseDto } from 'apps/api/src/modules/question/dtos/create-question-response.dto';
import { DeleteQuestionResponseDto } from 'apps/api/src/modules/question/dtos/delete-question-response.dto';
import { GetQuestionResponseDto } from 'apps/api/src/modules/question/dtos/get-question-response.dto';
import { UpdateQuestionRequestDto } from 'apps/api/src/modules/question/dtos/update-question-request.dto';
import { UpdateQuestionResponseDto } from 'apps/api/src/modules/question/dtos/update-question-response.dto';

import { EConfig } from '../../config/interfaces/config.interface';
import { mapQuizEntityToQuizDomain } from '../quiz/mappers/quiz.mapper';
import { QuizRepository } from '../quiz/models/quiz.repository';
import {
    mapQuestionEntityToQuestionCreateQuestionResponse,
    mapQuestionEntityToQuestionDomain,
} from './mappers/question.mapper';
import { QuestionEntity } from './models/question.entity';
import { QuestionRepository } from './models/question.repository';

@Injectable()
export class QuestionService {
    private maximumQuestionsPerQuiz: number;
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,
        private readonly configService: ConfigService,
        private readonly questionRepo: QuestionRepository,
        private readonly quizRepo: QuizRepository,
    ) {
        this.maximumQuestionsPerQuiz = this.configService.get<number>(
            EConfig.MAXIMUM_QUESTIONS_PER_QUIZ,
        );
    }

    async getQuestions(quizId: Question['quizId']): Promise<GetQuestionResponseDto[]> {
        this.logger.info('Getting questions according to a quiz', {
            prop: { quizId },
        });

        let questions: QuestionEntity[];
        try {
            questions = await this.questionRepo.find({
                where: {
                    quizId: quizId,
                },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error finding questions',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-get-error-#0001',
            });
        }

        const response: GetQuestionResponseDto[] = await Promise.all(
            questions.map(async question => {
                const getQuestionResponseDto = new GetQuestionResponseDto();
                getQuestionResponseDto.id = question.id;
                getQuestionResponseDto.quizId = question.quizId;
                getQuestionResponseDto.choices = question.choices;
                getQuestionResponseDto.correctAnswers = question.correctAnswers;
                getQuestionResponseDto.questionText = question.questionText;
                getQuestionResponseDto.questionType = question.questionType;
                getQuestionResponseDto.timeLimitInSecond = question.timeLimitInSecond;
                getQuestionResponseDto.imageFileUrl = question.imageFormat
                    ? await this.fileService.getSignedUrl(
                          `${EFolderName.QUESTION_IMAGE}/quiz_id_${question.quizId}/question_id_${question.id}.${question.imageFormat}`,
                      )
                    : null;

                return getQuestionResponseDto;
            }),
        );

        return response;
    }

    async create(data: {
        createQuestionDto: CreateQuestionRequestDto;
        userPayload: UserPayloadDto;
        s3StageFilePath: string;
        callFromClient: boolean;
    }): Promise<Question | CreateQuestionResponseDto> {
        this.logger.info('Creating a new question', {
            prop: { ...data },
        });

        const { createQuestionDto, userPayload, s3StageFilePath, callFromClient } = data;
        let quizExists = null;
        try {
            quizExists = await this.quizRepo.findOne({
                where: { id: createQuestionDto.quizId },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error finding quiz',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-create-error-#0001',
            });
        }

        if (!quizExists) {
            throw new RpcException({
                message: 'Quiz not found',
                status: HttpStatus.NOT_FOUND,
                code: 'quiz-question-service-create-error-#0002',
            });
        }

        if (quizExists.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-question-service-create-error-#0003',
            });
        }

        let questionCount = 0;
        try {
            questionCount = await this.questionRepo.count({
                where: { quizId: createQuestionDto.quizId },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error counting questions',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-create-error-#0004',
            });
        }

        if (questionCount >= this.maximumQuestionsPerQuiz) {
            throw new RpcException({
                message:
                    'Maximum question limit reached for this quiz: ' + this.maximumQuestionsPerQuiz,
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-create-error-#0005',
            });
        }

        const quiz: Quiz = mapQuizEntityToQuizDomain(quizExists);

        const newQuestion = new Question();
        Object.assign(newQuestion, {
            ...createQuestionDto,
            quiz,
        });

        const [passValidation, error] = newQuestion.validate();

        if (!passValidation) {
            throw new RpcException({
                message: `Validation error: ${error}`,
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-create-error-#0006',
            });
        }

        const savedQuestion = new QuestionEntity();
        Object.assign(savedQuestion, newQuestion);
        if (s3StageFilePath) {
            const fileFormat = s3StageFilePath.split('.').pop();
            savedQuestion.imageFormat = fileFormat;
        }

        try {
            const savedQuestionResponse = await this.questionRepo.save(savedQuestion);

            let fileUploadResponse = null;
            if (s3StageFilePath) {
                const fileFormat = s3StageFilePath.split('.').pop();
                const targetFilePath = `${EFolderName.QUESTION_IMAGE}/quiz_id_${savedQuestionResponse.quiz.id}/question_id_${savedQuestionResponse.id}.${fileFormat}`;
                fileUploadResponse = await this.fileService.updateFileName(
                    s3StageFilePath,
                    targetFilePath,
                );
            }

            if (callFromClient) {
                return mapQuestionEntityToQuestionDomain(savedQuestionResponse, fileUploadResponse);
            } else {
                return mapQuestionEntityToQuestionCreateQuestionResponse(
                    savedQuestionResponse,
                    fileUploadResponse,
                );
            }
        } catch (error) {
            this.logger.error('Error creating question', {
                prop: {
                    createQuestionDto,
                    userPayload,
                    s3StageFilePath,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Error creating question',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-create-error-#0007',
            });
        }
    }

    async removeQuiz(quizId: Question['quizId']): Promise<void> {
        this.logger.info('Deleting all questions of a quiz', {
            prop: { quizId },
        });

        try {
            await this.questionRepo.delete({
                quiz: { id: quizId },
            });

            await this.fileService.removeFolder(`${EFolderName.QUESTION_IMAGE}/quiz_id_${quizId}`);
        } catch (error) {
            this.logger.error('Error deleting questions of a quiz', {
                prop: { quizId },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Error deleting questions of a quiz',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-delete-error-#0001',
            });
        }
    }

    async update(data: {
        id: Question['id'];
        updateQuestionDto: UpdateQuestionRequestDto;
        userPayload: UserPayloadDto;
        s3StageFilePath: string;
        callFromClient: boolean;
    }): Promise<Quiz | UpdateQuestionResponseDto> {
        this.logger.info('Updating a question', {
            prop: { ...data },
        });

        const { id, updateQuestionDto, userPayload, s3StageFilePath, callFromClient } = data;

        let questionExists: QuestionEntity = null;
        try {
            questionExists = await this.questionRepo.findByQuizIdWithRelations(id);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error finding question',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-update-error-#0001',
            });
        }

        if (!questionExists) {
            throw new RpcException({
                message: 'Question not found',
                status: HttpStatus.NOT_FOUND,
                code: 'quiz-question-service-update-error-#0002',
            });
        }

        if (questionExists.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-question-service-update-error-#0003',
            });
        }

        const quiz: Quiz = mapQuizEntityToQuizDomain(questionExists.quiz);

        const updatedQuestion = new Question();
        Object.assign(updatedQuestion, {
            ...updateQuestionDto,
            quiz,
        });
        updatedQuestion.id = questionExists.id;

        const [passValidation, error] = updatedQuestion.validate();

        if (!passValidation) {
            throw new RpcException({
                message: `Validation error: ${error}`,
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-update-error-#0004',
            });
        }

        if (updateQuestionDto.updateImage === false && s3StageFilePath) {
            throw new RpcException({
                message: 'Cannot update image without setting updateImage to true',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-update-error-#0005',
            });
        }

        const updatedQuestionEntity = new QuestionEntity();

        Object.assign(updatedQuestionEntity, updatedQuestion);

        if (updateQuestionDto.updateImage) {
            if (s3StageFilePath) {
                // Update image
                const fileFormat = s3StageFilePath.split('.').pop();
                updatedQuestionEntity.imageFormat = fileFormat;
            } else {
                // Remove old image
                updatedQuestionEntity.imageFormat = null;
            }

            if (questionExists.imageFormat) {
                try {
                    this.fileService.removeFile(
                        `${EFolderName.QUESTION_IMAGE}/quiz_id_${questionExists.quiz.id}/question_id_${questionExists.id}.${questionExists.imageFormat}`,
                    );
                } catch (error) {
                    throw new RpcException({
                        message: error.message || error || 'Error deleting old image',
                        status: HttpStatus.BAD_REQUEST,
                        code: 'quiz-question-service-update-error-#0006',
                    });
                }
            }
        }

        try {
            updatedQuestionEntity.choicesInDatabase = JSON.stringify(updatedQuestionEntity.choices);
            updatedQuestionEntity.correctAnswersInDatabase = JSON.stringify(
                updatedQuestionEntity.correctAnswers,
            );

            const updatedQuestionResponse = await this.questionRepo.save(updatedQuestionEntity);

            let fileUploadResponse = null;
            if (s3StageFilePath) {
                const fileFormat = s3StageFilePath.split('.').pop();
                const targetFilePath = `${EFolderName.QUESTION_IMAGE}/quiz_id_${updatedQuestionResponse.quiz.id}/question_id_${updatedQuestionResponse.id}.${fileFormat}`;
                fileUploadResponse = await this.fileService.updateFileName(
                    s3StageFilePath,
                    targetFilePath,
                );
            }

            if (callFromClient) {
                return mapQuestionEntityToQuestionDomain(
                    updatedQuestionResponse,
                    fileUploadResponse,
                );
            } else {
                return mapQuestionEntityToQuestionCreateQuestionResponse(
                    updatedQuestionResponse,
                    fileUploadResponse,
                );
            }
        } catch (error) {
            this.logger.error('Error updating question', {
                prop: {
                    id,
                    updateQuestionDto,
                    userPayload,
                    s3StageFilePath,
                },
                error,
            });

            throw new RpcException({
                message: error.message || error || 'Error updating question',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-update-error-#0005',
            });
        }
    }

    async remove(data: {
        id: Question['id'];
        userPayload: UserPayloadDto;
        callFromClient: boolean;
    }): Promise<DeleteQuestionResponseDto> {
        this.logger.info('Removing a question', {
            prop: { ...data },
        });

        const { id, userPayload } = data;

        let questionExists: QuestionEntity = null;
        try {
            questionExists = await this.questionRepo.findByQuizIdWithRelations(id);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error finding question',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-remove-error-#0001',
            });
        }

        const response = new DeleteQuestionResponseDto();

        if (!questionExists) {
            response.message = 'Question not found';
            return response;
        }

        if (questionExists.quiz.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access',
                status: HttpStatus.UNAUTHORIZED,
                code: 'quiz-question-service-remove-error-#0003',
            });
        }

        try {
            this.questionRepo.delete({ id });
            if (questionExists.imageFormat) {
                this.fileService.removeFile(
                    `${EFolderName.QUESTION_IMAGE}/quiz_id_${questionExists.quiz.id}/question_id_${questionExists.id}.${questionExists.imageFormat}`,
                );
            }
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error deleting question',
                status: HttpStatus.BAD_REQUEST,
                code: 'quiz-question-service-remove-error-#0004',
            });
        }

        response.message = 'Question deleted successfully';
        return response;
    }
}
