import { ApiResponseProperty, PartialType } from '@nestjs/swagger';

import { CreateQuestionResponseDto } from './create-question-response.dto';

export class GetQuestionResponseDto extends PartialType(CreateQuestionResponseDto) {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    questionIndexInQuiz?: number;
}
