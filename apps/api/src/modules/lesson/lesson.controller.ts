import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Body, Delete, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { GenerateLessonRequestDto } from './dtos/create-lesson-request.dto';
import { GenerateLessonResponseDto } from './dtos/create-lesson-response.dto';
import { DeleteLessonResponseDto } from './dtos/delete-lesson-response.dto';
import { UpdateLessonRequestDto } from './dtos/update-lesson-request.dto';
import { UpdateLessonResponseDto } from './dtos/update-lesson-response.dto';
import { LessonService } from './lesson.service';

@ApiSwaggerController({
    name: EApiRoute.LESSON,
})
@RestrictToTeacher()
export class LessonController {
    constructor(
        private readonly lessonService: LessonService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Generate a lesson',
        response: GenerateLessonResponseDto,
    })
    async generateLesson(
        @Body() generateLessonRequestDto: GenerateLessonRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.LESSON}_${userPayload.id}_${JSON.stringify(
            generateLessonRequestDto,
        )}`;

        const cacheMessage = await this.redisService.get(cacheKey);

        if (cacheMessage) return cacheMessage;

        const newMessage = await this.lessonService.generateLesson(
            generateLessonRequestDto,
            userPayload,
        );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, newMessage);
        }

        return newMessage;
    }

    @Put(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Update a lesson',
        response: UpdateLessonResponseDto,
    })
    async updateLesson(
        @Param('id') lessonId: number,
        @Body() updateLessonRequestDto: UpdateLessonRequestDto,
        @UserPayload() userPayloadDto: UserPayloadDto,
    ) {
        const response = await this.lessonService.updateLesson(
            lessonId,
            updateLessonRequestDto,
            userPayloadDto,
        );

        return response;
    }

    @Delete(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Delete a lesson',
        response: DeleteLessonResponseDto,
    })
    async deleteLesson(
        @Param('id') lessonId: number,
        @UserPayload() userPayloadDto: UserPayloadDto,
    ) {
        const response = await this.lessonService.deleteLesson(lessonId, userPayloadDto);

        return response;
    }
}
