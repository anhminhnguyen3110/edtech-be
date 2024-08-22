import { PartialType } from '@nestjs/swagger';

import { CreateQuizResponseDto } from './create-quiz-response.dto';

export class UpdateQuizResponseDto extends PartialType(CreateQuizResponseDto) {}
