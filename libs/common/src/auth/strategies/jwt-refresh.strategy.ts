import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { EConfig } from 'apps/api/src/config/interfaces/config.interface';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtRefreshPayload } from '../interface/jwt.interface';

@Injectable()
export class JWTRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>(EConfig.JWT_REFRESH_SECRET_KEY),
        });
    }

    async validate(payload: IJwtRefreshPayload) {
        if (!payload || !payload.sessionId || !payload.hash) {
            throw new UnauthorizedException({
                message: 'Invalid token',
                statusCode: 401,
                code: 'api-auth-service-ts-jwt-refresh-strategy-error-#0001',
            });
        }
        return payload;
    }
}
