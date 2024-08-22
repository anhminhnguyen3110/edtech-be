import { FileModule } from '@app/common/file/file.module';
import { forwardRef, Module } from '@nestjs/common';

import { QuizModule } from '../quiz/quiz.module';
import { QuestionEntity } from './models/question.entity';
import { QuestionRepository } from './models/question.repository';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
    imports: [FileModule, forwardRef(() => QuizModule)],
    controllers: [QuestionController],
    providers: [QuestionService, QuestionEntity, QuestionRepository],
    exports: [QuestionService, QuestionEntity, QuestionRepository],
})
export class QuestionModule {}
