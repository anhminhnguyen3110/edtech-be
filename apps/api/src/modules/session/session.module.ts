import { Module } from '@nestjs/common';

import { SessionRepository } from './models/session.repository';
import { SessionService } from './session.service';

@Module({
    imports: [],
    providers: [SessionService, SessionRepository],
    exports: [SessionService, SessionRepository],
})
export class SessionModule {}
