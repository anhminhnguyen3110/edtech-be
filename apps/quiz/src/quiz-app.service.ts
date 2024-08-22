import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizAppService {
    getHello(): string {
        return 'Hello World!';
    }
}
