import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Body, Delete, HttpStatus, Param, Post, Put } from '@nestjs/common';

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
    constructor(private readonly lessonService: LessonService) {}

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
        return await this.lessonService.generateLesson(generateLessonRequestDto, userPayload);
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
