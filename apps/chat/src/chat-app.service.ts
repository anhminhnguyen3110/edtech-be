import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatAppService {
    getHello(): string {
        return 'Hello World!';
    }
}
