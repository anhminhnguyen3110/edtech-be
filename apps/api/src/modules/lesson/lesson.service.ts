import { ECommandLesson } from '@app/common/constants/command.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { GenerateLessonRequestDto } from './dtos/create-lesson-request.dto';
import { GenerateLessonResponseDto } from './dtos/create-lesson-response.dto';
import { DeleteLessonResponseDto } from './dtos/delete-lesson-response.dto';
import { GetLessonRequestDto } from './dtos/get-lesson-request.dto';
import { GetLessonResponseDto } from './dtos/get-lesson-response.dto';
import { UpdateLessonRequestDto } from './dtos/update-lesson-request.dto';
import { UpdateLessonResponseDto } from './dtos/update-lesson-response.dto';

@Injectable()
export class LessonService {
    constructor(
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async getLessons(
        getLessonRequestDto: GetLessonRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<PaginationResponseDto<GetLessonResponseDto>> {
        this.logger.info('Getting all lessons', {
            prop: {
                getLessonRequestDto,
                userPayload,
            },
        });

        try {
            const lessons: PaginationResponseDto<GetLessonResponseDto> = await firstValueFrom(
                this.httpClient
                    .send(ECommandLesson.FIND_ALL_LESSONS, {
                        getLessonRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return lessons;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting lessons',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-lesson-service-get-all-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async deleteLesson(
        lessonId: number,
        userPayload: UserPayloadDto,
    ): Promise<DeleteLessonResponseDto> {
        this.logger.info('Deleting lesson', {
            prop: {
                lessonId,
                userPayload,
            },
        });

        try {
            const response = await firstValueFrom(
                this.httpClient
                    .send(ECommandLesson.REMOVE_LESSON, {
                        lessonId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );
            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error deleting lesson',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-lesson-service-delete-error-#0003',
            } as IErrorResponseDto);
        }
    }

    async updateLesson(
        lessonId: number,
        updateLessonRequestDto: UpdateLessonRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<UpdateLessonResponseDto> {
        this.logger.info('Updating lesson', {
            prop: {
                lessonId,
                updateLessonRequestDto,
                userPayload,
            },
        });

        try {
            const response = await firstValueFrom(
                this.httpClient
                    .send(ECommandLesson.UPDATE_LESSON, {
                        lessonId,
                        updateLessonRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );
            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error updating lesson',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-lesson-service-update-error-#0002',
            } as IErrorResponseDto);
        }
    }

    async generateLesson(
        generateLessonRequestDto: GenerateLessonRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<GenerateLessonResponseDto> {
        this.logger.info('Generating lesson', {
            prop: {
                generateLessonRequestDto,
                userPayload,
            },
        });

        try {
            this.httpClient
                .emit(ECommandLesson.GENERATE_LESSON, {
                    generateLessonRequestDto,
                    userPayload: userPayload,
                })
                .pipe(timeout(3000));
            const response = new GenerateLessonResponseDto();
            response.message =
                'Lesson generating is being run in the background, please wait for 3-5 minutes. In the meantime, you can do other things.';
            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error generating lesson',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-lesson-service-generate-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
