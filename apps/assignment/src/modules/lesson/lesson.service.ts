import { getJobConfig } from '@app/common/bull/bull.option';
import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ECommandNotification } from '@app/common/constants/command.constant';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import { EApiRoute } from '@app/common/constants/route.constants';
import {
    EFileService,
    ELoggerService,
    ERegisterMicroservice,
} from '@app/common/constants/service.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { AFileService } from '@app/common/file/file.abstract';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PptService } from '@app/common/ppt/ppt.service';
import { RedisService } from '@app/common/redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { GetIssueResponseDto } from 'apps/api/src/modules/issue/dtos/get-issue-response.dto';
import {
    GenerateLessonRequestDto,
    LessonContentDto,
} from 'apps/api/src/modules/lesson/dtos/create-lesson-request.dto';
import { DeleteLessonResponseDto } from 'apps/api/src/modules/lesson/dtos/delete-lesson-response.dto';
import { UpdateLessonRequestDto } from 'apps/api/src/modules/lesson/dtos/update-lesson-request.dto';
import { UpdateLessonResponseDto } from 'apps/api/src/modules/lesson/dtos/update-lesson-response.dto';
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import { Queue } from 'bull';

import { ClassAssignmentEntity } from '../assignment/models/class-assignment.entity';
import { ClassAssignmentRepository } from '../assignment/models/class-assignment.repository';
import { IssueEntity } from '../issue/models/issue.entity';
import { IssueRepository } from '../issue/models/issue.repository';
import { LessonEntity } from './models/lesson.entity';
import { LessonRepository } from './models/lesson.repository';

@Injectable()
export class LessonService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @InjectQueue(EBullQueue.GENERATE_LESSON_QUEUE)
        private readonly generateLessonQueue: Queue,

        // Repositories
        private readonly lessonRepo: LessonRepository,
        private readonly classAssignmentRepo: ClassAssignmentRepository,
        private readonly issueRepo: IssueRepository,

        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
        @Inject(EFileService.FILE_KEY)
        private readonly fileService: AFileService,

        private readonly pptService: PptService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}
    async deleteLesson(
        lessonId: number,
        userPayload: UserPayloadDto,
    ): Promise<DeleteLessonResponseDto> {
        this.logger.info('Deleting lesson', {
            prop: { lessonId, userPayload },
        });

        let lesson: LessonEntity;

        try {
            lesson = await this.lessonRepo.findOne({
                where: { id: lessonId },
                relations: ['classAssignment'],
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error retrieving lesson',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'lesson-service-delete-error-#0001',
            });
        }

        if (!lesson) {
            throw new RpcException({
                message: 'Lesson not found',
                status: HttpStatus.NOT_FOUND,
                code: 'lesson-service-delete-error-#0002',
            });
        }

        if (lesson.classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'lesson-service-delete-error-#0003',
            });
        }

        try {
            await this.lessonRepo.remove(lesson);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error deleting lesson',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'lesson-service-delete-error-#0004',
            });
        }

        try {
            const s3Folder = this.configService.get<string>(ECommonConfig.LESSON_S3_FOLDER);
            const externalFilePath = `${s3Folder}/${lessonId}/${lesson.name}.${lesson.fileFormat}`;
            await this.fileService.removeFile(externalFilePath);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error deleting lesson',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'lesson-service-delete-error-#0004',
            });
        }

        const response = new DeleteLessonResponseDto();
        response.message = 'Lesson deleted successfully';

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${userPayload.id}_${lesson.classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        return response;
    }

    async updateLesson(
        lessonId: number,
        updateLessonRequestDto: UpdateLessonRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<UpdateLessonResponseDto> {
        this.logger.info('Updating lesson', {
            prop: { lessonId, updateLessonRequestDto, userPayload },
        });

        let lesson: LessonEntity;

        try {
            lesson = await this.lessonRepo.findOne({
                where: { id: lessonId },
                relations: ['classAssignment'],
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error retrieving lesson',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'lesson-service-update-error-#0001',
            });
        }

        if (!lesson) {
            throw new RpcException({
                message: 'Lesson not found',
                status: HttpStatus.NOT_FOUND,
                code: 'lesson-service-update-error-#0002',
            });
        }

        if (lesson.classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'lesson-service-update-error-#0003',
            });
        }

        const oldLesson = Object.assign({}, lesson);

        Object.assign(lesson, updateLessonRequestDto);

        try {
            await this.lessonRepo.save(lesson);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error updating lesson',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'lesson-service-update-error-#0004',
            });
        }

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${userPayload.id}_${lesson.classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        let newSignedUrl: string;
        try {
            const s3Folder = this.configService.get<string>(ECommonConfig.LESSON_S3_FOLDER);
            const externalFilePath = `${s3Folder}/${oldLesson.id}/${oldLesson.name}.${oldLesson.fileFormat}`;

            const newFilePath = `${s3Folder}/${lesson.id}/${lesson.name}.${lesson.fileFormat}`;
            newSignedUrl = await this.fileService.updateFileName(externalFilePath, newFilePath);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error updating lesson',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'lesson-service-update-error-#0005',
            });
        }

        const response = new UpdateLessonResponseDto();
        response.id = lesson.id;
        response.name = lesson.name;
        response.fileUrl = newSignedUrl;
        return response;
    }

    async generateLesson(
        generateLessonRequestDto: GenerateLessonRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<void> {
        this.logger.info('Generating lesson', {
            prop: {
                classAssignmentId: generateLessonRequestDto.classAssignmentId,
                userPayload,
            },
        });

        const classAssignment: ClassAssignmentEntity = await this.classAssignmentRepo.findOne({
            where: { id: generateLessonRequestDto.classAssignmentId },
            relations: ['assignment'],
        });

        if (!classAssignment) {
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Class assignment not found for id ${generateLessonRequestDto.classAssignmentId} when generating lesson`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: generateLessonRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        if (classAssignment.accountId !== userPayload.id) {
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Unauthorized to generate lesson for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: generateLessonRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        const issues: IssueEntity[] = await this.issueRepo.find({
            where: { classAssignmentId: classAssignment.id },
        });

        if (!issues.length) {
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `You must have at least one issue to generate a lesson for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: generateLessonRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        const lessons = await this.lessonRepo.find({
            where: { classAssignmentId: classAssignment.id },
        });

        if (lessons.length >= 5) {
            this.logger.error('Lesson limit reached', {
                prop: {
                    classAssignmentId: generateLessonRequestDto.classAssignmentId,
                    userPayload,
                },
            });

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `You have reached the limit of 5 lessons for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: generateLessonRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        generateLessonRequestDto.issues = issues.map(issue => {
            const getIssueResponseDto = new GetIssueResponseDto();
            getIssueResponseDto.id = issue.id;
            getIssueResponseDto.name = issue.name;
            getIssueResponseDto.description = issue.description;
            getIssueResponseDto.studentCount = issue.studentCount;
            getIssueResponseDto.studentRate = issue.studentRate;
            getIssueResponseDto.classAssignmentId = issue.classAssignmentId;
            return getIssueResponseDto;
        });

        generateLessonRequestDto.year = classAssignment?.assignment?.year || null;

        generateLessonRequestDto.accountId = userPayload.id;

        if (generateLessonRequestDto.year) {
            generateLessonRequestDto.year = generateLessonRequestDto.year.replace('YEAR', 'GRADE');
            generateLessonRequestDto.year += '/12';
        }

        this.generateLessonQueue.add(
            EBullQueueMessage.GENERATE_LESSON,
            generateLessonRequestDto,
            getJobConfig(),
        );
    }

    async saveGenerateLesson(data: {
        generateLessonRequestDto: GenerateLessonRequestDto;
        lessonContent: LessonContentDto;
        accountId: number;
    }): Promise<void> {
        const { generateLessonRequestDto, lessonContent, accountId } = data;

        this.logger.info('Saving generated lesson', {
            prop: {
                generateLessonRequestDto: generateLessonRequestDto,
                accountId: accountId,
            },
        });

        const queryRunner = await this.lessonRepo.getQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const lesson = new LessonEntity();
            lesson.name = generateLessonRequestDto.name;
            lesson.classAssignmentId = generateLessonRequestDto.classAssignmentId;
            lesson.fileFormat = this.configService.get<string>(
                ECommonConfig.DEFAULT_LESSON_FILE_FORMAT,
            );
            lesson.content = lessonContent;

            try {
                await this.lessonRepo.save(lesson);
            } catch (error) {
                this.logger.error(error);
                await queryRunner.rollbackTransaction();
                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message:
                        ((error.message || error || 'Error saving lesson') as string) +
                        ` for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
                    eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                    classAssignmentId: generateLessonRequestDto.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: accountId,
                });
                return;
            }

            try {
                this.pptService.createLessonPpt(lessonContent, lesson.id, lesson.name);
            } catch (error) {
                this.logger.error(error);
                await queryRunner.rollbackTransaction();
                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message:
                        ((error.message || error || 'Error creating ppt') as string) +
                        ` for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
                    eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                    classAssignmentId: generateLessonRequestDto.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: accountId,
                });
            }
        } catch (error) {
            this.logger.error(error);
            await queryRunner.rollbackTransaction();
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Error saving lesson') as string) +
                    ` for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: generateLessonRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: accountId,
            });
        } finally {
            await queryRunner.release();
        }

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${accountId}_${generateLessonRequestDto.classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        const createNotificationRequestDto: CreateNotificationRequestDto = {
            message: `Lesson ${generateLessonRequestDto.name} generated successfully for class assignment id ${generateLessonRequestDto.classAssignmentId}`,
            eventType: ENotificationEventType.GENERATE_LESSON_SUCCESS,
            classAssignmentId: generateLessonRequestDto.classAssignmentId,
        };

        this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
            createNotificationRequestDto,
            accountId: accountId,
        });
    }
}
