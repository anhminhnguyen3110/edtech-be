import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import {
    Body,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { CreateQuizRequestDto, GenerateQuizRequestDto } from './dtos/create-quiz-request.dto';
import { CreateQuizResponseDto, GenerateQuizResponseDto } from './dtos/create-quiz-response.dto';
import { DeleteQuizResponseDto } from './dtos/delete-quiz-response.dto';
import { GetQuizDetailRequestDto, GetQuizRequestDto } from './dtos/get-quiz-request.dto';
import { GetQuizDetailResponseDto, GetQuizResponseDto } from './dtos/get-quiz-response.dto';
import { UpdateQuizRequestDto } from './dtos/update-quiz-request.dto';
import { UpdateQuizResponseDto } from './dtos/update-quiz-response.dto';
import { QuizService } from './quiz.service';

@ApiSwaggerController({ name: EApiRoute.Quiz })
@RestrictToTeacher()
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Create a new quiz',
        response: CreateQuizResponseDto,
    })
    async create(
        @Body() createQuizRequestDto: CreateQuizRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.quizService.create(createQuizRequestDto, userPayload);
    }

    @Patch(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Update a quiz',
        response: UpdateQuizResponseDto,
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateQuizRequestDto: UpdateQuizRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.quizService.update(+id, updateQuizRequestDto, userPayload);
    }

    @Delete(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Delete a quiz',
        response: DeleteQuizResponseDto,
    })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.quizService.remove(+id, userPayload);
    }

    @Get()
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get all quizzes',
        response: PaginationResponseDto<GetQuizResponseDto>,
    })
    async findAll(
        @Query() getQuizRequestDto: GetQuizRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.quizService.findAll(getQuizRequestDto, userPayload);
    }

    @Get('detail/:id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get a quiz with detail information',
        response: GetQuizDetailResponseDto,
    })
    async findOneWithDetail(
        @Param('id', ParseIntPipe) id: number,
        @Query()
        getQuizDetailRequestDto: GetQuizDetailRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.quizService.findOneWithDetail(+id, getQuizDetailRequestDto, userPayload);
    }

    @Post('/generate')
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Generate quiz',
        response: GenerateQuizResponseDto,
    })
    async generateQuiz(
        @Body() generateQuizRequestDto: GenerateQuizRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return await this.quizService.generateQuiz(generateQuizRequestDto, userPayload);
    }
}
