import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { EConfig } from 'apps/api/src/config/interfaces/config.interface';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtPayload } from '../interface/jwt.interface';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>(EConfig.JWT_SECRET_KEY),
        });
    }

    async validate(payload: IJwtPayload) {
        if (!payload) {
            throw new UnauthorizedException({
                statusCode: 401,
                message: 'Unauthorized',
                code: 'api-jwt-strategy-ts-validate-error-#0001',
            });
        }

        return payload;
    }
}
