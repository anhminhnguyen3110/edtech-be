import { PartialType } from '@nestjs/swagger';

import { CreateQuizRequestDto } from './create-quiz-request.dto';

export class UpdateQuizRequestDto extends PartialType(CreateQuizRequestDto) {}
