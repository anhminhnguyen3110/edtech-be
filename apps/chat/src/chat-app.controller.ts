import { Controller } from '@nestjs/common';

import { ChatAppService } from './chat-app.service';

@Controller()
export class ChatAppController {
    constructor(private readonly _: ChatAppService) {}
}
