import { ECommandLesson } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
    GenerateLessonRequestDto,
    LessonContentDto,
} from 'apps/api/src/modules/lesson/dtos/create-lesson-request.dto';
import { DeleteLessonResponseDto } from 'apps/api/src/modules/lesson/dtos/delete-lesson-response.dto';
import { UpdateLessonRequestDto } from 'apps/api/src/modules/lesson/dtos/update-lesson-request.dto';
import { UpdateLessonResponseDto } from 'apps/api/src/modules/lesson/dtos/update-lesson-response.dto';

import { LessonService } from './lesson.service';

@Controller()
export class LessonController {
    constructor(private readonly lessonService: LessonService) {}

    @EventPattern(ECommandLesson.GENERATE_LESSON)
    async generateLesson(
        @Payload()
        data: {
            generateLessonRequestDto: GenerateLessonRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<void> {
        return this.lessonService.generateLesson(data.generateLessonRequestDto, data.userPayload);
    }

    @EventPattern(ECommandLesson.SAVE_GENERATE_LESSON)
    async saveGenerateLesson(
        @Payload()
        data: {
            generateLessonRequestDto: GenerateLessonRequestDto;
            lessonContent: LessonContentDto;
            accountId: number;
        },
    ): Promise<void> {
        return this.lessonService.saveGenerateLesson(data);
    }

    @MessagePattern(ECommandLesson.REMOVE_LESSON)
    async deleteLesson(
        @Payload()
        data: {
            lessonId: number;
            userPayload: UserPayloadDto;
        },
    ): Promise<DeleteLessonResponseDto> {
        return this.lessonService.deleteLesson(data.lessonId, data.userPayload);
    }

    @MessagePattern(ECommandLesson.UPDATE_LESSON)
    async updateLesson(
        @Payload()
        data: {
            lessonId: number;
            updateLessonRequestDto: UpdateLessonRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<UpdateLessonResponseDto> {
        return this.lessonService.updateLesson(
            data.lessonId,
            data.updateLessonRequestDto,
            data.userPayload,
        );
    }
}
