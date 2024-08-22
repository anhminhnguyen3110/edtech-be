import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JWTRefreshStrategy } from '../../../../../libs/common/src/auth/strategies/jwt-refresh.strategy';
import { JWTStrategy } from '../../../../../libs/common/src/auth/strategies/jwt.strategy';
import { EConfig } from '../../config/interfaces/config.interface';
import { AccountModule } from '../account/account.module';
import { SessionModule } from '../session/session.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
    imports: [
        forwardRef(() => AccountModule),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>(EConfig.JWT_SECRET_KEY),
                signOptions: {
                    expiresIn: configService.get<string>(EConfig.ACCESS_TOKEN_EXPIRES_IN),
                },
            }),
        }),
        PassportModule,
        SessionModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JWTRefreshStrategy, JWTStrategy],
    exports: [AuthService],
})
export class AuthModule {}
