import { PartialType } from '@nestjs/swagger';

import { GetLessonResponseDto } from './get-lesson-response.dto';

export class UpdateLessonResponseDto extends PartialType(GetLessonResponseDto) {}
