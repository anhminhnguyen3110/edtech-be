import { ECommandQuiz } from '@app/common/constants/command.constant';
import { Quiz } from '@app/common/domain/quiz.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
    CreateQuizRequestDto,
    GenerateQuizRequestDto,
} from 'apps/api/src/modules/quiz/dtos/create-quiz-request.dto';
import {
    GetQuizDetailRequestDto,
    GetQuizRequestDto,
} from 'apps/api/src/modules/quiz/dtos/get-quiz-request.dto';
import { UpdateQuizRequestDto } from 'apps/api/src/modules/quiz/dtos/update-quiz-request.dto';

import { QuizService } from './quiz.service';

@Controller()
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @MessagePattern(ECommandQuiz.CREATE_QUIZ)
    async create(
        @Payload()
        data: {
            createQuizRequestDto: CreateQuizRequestDto;
            userPayload: UserPayloadDto;
            callFromClient: boolean;
        },
    ) {
        return this.quizService.create(data);
    }

    @MessagePattern(ECommandQuiz.FIND_ALL_QUIZZES)
    async findAll(
        @Payload()
        data: {
            getQuizRequestDto: GetQuizRequestDto;
            userPayload: UserPayloadDto;
            callFromClient: boolean;
        },
    ) {
        return this.quizService.findAll(data);
    }

    @MessagePattern(ECommandQuiz.FIND_ONE_QUIZ)
    async findOneWithDetail(
        @Payload()
        data: {
            id: Quiz['id'];
            getQuizDetailRequestDto: GetQuizDetailRequestDto;
            userPayload: UserPayloadDto;
            callFromClient: boolean;
        },
    ) {
        return this.quizService.findOneWithDetail(data);
    }

    @MessagePattern(ECommandQuiz.UPDATE_QUIZ)
    async update(
        @Payload()
        data: {
            id: Quiz['id'];
            updateQuizRequestDto: UpdateQuizRequestDto;
            userPayload: UserPayloadDto;
            callFromClient: boolean;
        },
    ) {
        return this.quizService.update(data);
    }

    @MessagePattern(ECommandQuiz.REMOVE_QUIZ)
    async remove(
        @Payload()
        data: {
            id: Quiz['id'];
            userPayload: UserPayloadDto;
            callFromClient: boolean;
        },
    ) {
        return this.quizService.remove(data);
    }

    @EventPattern(ECommandQuiz.GENERATE_QUIZ)
    async generateQuiz(
        @Payload()
        data: {
            generateQuizRequestDto: GenerateQuizRequestDto;
            userPayload: UserPayloadDto;
        },
    ) {
        return this.quizService.generateQuiz(data);
    }

    @EventPattern(ECommandQuiz.SAVE_GENERATE_QUIZ)
    async saveGenerateQuiz(
        @Payload()
        data: {
            generateQuizRequestDto: GenerateQuizRequestDto;
        },
    ) {
        return this.quizService.saveGenerateQuiz(data);
    }
}
