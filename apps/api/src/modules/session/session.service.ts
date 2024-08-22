import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';

import { CreateSessionRequestDto } from './dtos/CreateSessionRequestDto.dto';
import { UpdateSessionRequestDto } from './dtos/UpdateSessionRequestDto.dto';
import { SessionEntity } from './models/session.entity';
import { SessionRepository } from './models/session.repository';

@Injectable()
export class SessionService {
    constructor(private readonly sessionRepo: SessionRepository) {}

    async createSession(createSessionRequestDto: CreateSessionRequestDto): Promise<SessionEntity> {
        const { accountId, randomHash } = createSessionRequestDto;
        const newSession = new SessionEntity();
        newSession.accountId = accountId;
        newSession.randomHash = randomHash;
        try {
            return await this.sessionRepo.save(newSession);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Failed to create session',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-session-service-create-session-failed-#0001',
            });
        }
    }

    async getSessionById(id: number): Promise<SessionEntity> {
        try {
            const session = await this.sessionRepo.findOne({
                where: { id },
            });
            if (!session) {
                return null;
            }
            return session;
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Failed to get session',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-session-service-get-session-failed-#0001',
            });
        }
    }

    async getSessionByAccountId(accountId: number): Promise<SessionEntity> {
        try {
            const session = await this.sessionRepo.findOne({
                where: { accountId },
            });
            if (!session) {
                return null;
            }
            return session;
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Failed to get session',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-session-service-get-session-failed-#0001',
            });
        }
    }

    async updateSession(updateSession: UpdateSessionRequestDto): Promise<SessionEntity> {
        const { id, randomHash } = updateSession;

        try {
            const session = await this.sessionRepo.findOne({
                where: { id },
            });
            if (!session) {
                return null;
            }
            session.randomHash = randomHash;
            return this.sessionRepo.save(session);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Failed to update session',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-session-service-update-session-failed-#0001',
            });
        }
    }
}
