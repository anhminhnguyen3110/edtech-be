import { ApiResponseProperty, PartialType } from '@nestjs/swagger';

import { GetQuestionResponseDto } from '../../question/dtos/get-question-response.dto';
import { CreateQuizResponseDto } from './create-quiz-response.dto';

export class GetQuizResponseDto extends PartialType(CreateQuizResponseDto) {}

export class GetQuizDetailResponseDto extends PartialType(GetQuizResponseDto) {
    @ApiResponseProperty({
        type: [GetQuestionResponseDto],
    })
    questions: GetQuestionResponseDto[];
}
