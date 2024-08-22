import { getBullConfig } from '@app/common/bull/bull.option';
import { EBullQueue } from '@app/common/constants/queue.constant';
import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';

import { QuestionModule } from '../question/question.module';
import { QuizEntity } from './models/quiz.entity';
import { QuizRepository } from './models/quiz.repository';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
    imports: [
        forwardRef(() => QuestionModule),
        BullModule.forRootAsync(getBullConfig()),
        BullModule.registerQueue({
            name: EBullQueue.GENERATE_QUIZ_QUEUE,
        }),
    ],
    controllers: [QuizController],
    providers: [QuizService, QuizEntity, QuizRepository],
    exports: [QuizService, QuizEntity, QuizRepository],
})
export class QuizModule {}
