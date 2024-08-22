import { Controller, Get } from '@nestjs/common';

import { QuizAppService } from './quiz-app.service';

@Controller()
export class QuizAppController {
    constructor(private readonly quizService: QuizAppService) {}

    @Get()
    getHello(): string {
        return this.quizService.getHello();
    }
}
