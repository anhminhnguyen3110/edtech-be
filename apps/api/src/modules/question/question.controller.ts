import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { ImagePipe } from '@app/common/pipe/image.pipe';
import {
    BadRequestException,
    Body,
    Delete,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { extname } from 'path';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { CreateQuestionRequestDto } from './dtos/create-question-request.dto';
import { CreateQuestionResponseDto } from './dtos/create-question-response.dto';
import { DeleteQuestionResponseDto } from './dtos/delete-question-response.dto';
import { UpdateQuestionRequestDto } from './dtos/update-question-request.dto';
import { UpdateQuestionResponseDto } from './dtos/update-question-response.dto';
import { QuestionService } from './question.service';

@ApiSwaggerController({ name: EApiRoute.Question })
@RestrictToTeacher()
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Create a new question',
        response: CreateQuestionResponseDto,
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: (_, file, callback) => {
                const fileExtension = extname(file.originalname).toLowerCase();
                const allowedExtensions = ['.png', '.jpeg', '.jpg'];
                if (!allowedExtensions.includes(fileExtension)) {
                    return callback(
                        new BadRequestException({
                            message: 'Invalid file type. Only PNG and JPEG are allowed.',
                            statusCode: HttpStatus.BAD_REQUEST,
                            code: 'api-question-controller-#0001',
                        }),
                        false,
                    );
                }
                callback(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024, // 2 MB
            },
        }),
    )
    async create(
        @Body() createQuestionDto: CreateQuestionRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
        @UploadedFile(ImagePipe) file: Express.Multer.File,
    ) {
        return this.questionService.create(createQuestionDto, userPayload, file);
    }

    @Put(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Update a question',
        response: UpdateQuestionResponseDto,
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: (_, file, callback) => {
                const fileExtension = extname(file.originalname).toLowerCase();
                const allowedExtensions = ['.png', '.jpeg', '.jpg'];
                if (!allowedExtensions.includes(fileExtension)) {
                    return callback(
                        new BadRequestException({
                            message: 'Invalid file type. Only PNG and JPEG are allowed.',
                            statusCode: HttpStatus.BAD_REQUEST,
                            code: 'api-question-controller-#0002',
                        }),
                        false,
                    );
                }
                callback(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024, // 2 MB
            },
        }),
    )
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateQuestionDto: UpdateQuestionRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
        @UploadedFile(ImagePipe) file: Express.Multer.File,
    ) {
        return this.questionService.update(+id, updateQuestionDto, userPayload, file);
    }

    @Delete(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Delete a question',
        response: DeleteQuestionResponseDto,
    })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.questionService.remove(+id, userPayload);
    }
}
