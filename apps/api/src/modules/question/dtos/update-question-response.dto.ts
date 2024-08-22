import { PartialType } from '@nestjs/swagger';

import { CreateQuestionResponseDto } from './create-question-response.dto';

export class UpdateQuestionResponseDto extends PartialType(CreateQuestionResponseDto) {}
