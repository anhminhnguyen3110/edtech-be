import { ECommandQuestion } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateQuestionRequestDto } from 'apps/api/src/modules/question/dtos/create-question-request.dto';
import { UpdateQuestionRequestDto } from 'apps/api/src/modules/question/dtos/update-question-request.dto';

import { QuestionService } from './question.service';

@Controller()
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    @MessagePattern(ECommandQuestion.CREATE_QUESTION)
    async create(
        @Payload()
        data: {
            createQuestionDto: CreateQuestionRequestDto;
            userPayload: UserPayloadDto;
            s3StageFilePath: string;
            callFromClient: boolean;
        },
    ) {
        return this.questionService.create(data);
    }

    @MessagePattern(ECommandQuestion.UPDATE_QUESTION)
    async update(
        @Payload()
        data: {
            id: number;
            updateQuestionDto: UpdateQuestionRequestDto;
            userPayload: UserPayloadDto;
            s3StageFilePath: string;
            callFromClient: boolean;
        },
    ) {
        return this.questionService.update(data);
    }

    @MessagePattern(ECommandQuestion.REMOVE_QUESTION)
    async remove(
        @Payload()
        data: {
            id: number;
            userPayload: UserPayloadDto;
            callFromClient: boolean;
        },
    ) {
        return this.questionService.remove(data);
    }
}
