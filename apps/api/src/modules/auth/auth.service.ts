import { IJwtTransferPayload } from '@app/common/auth/interface/jwt.interface';
import { ELoggerService } from '@app/common/constants/service.constant';
import { Account } from '@app/common/domain/account.domain';
import {
    RefreshTokenDto,
    UserPayloadDto,
    VerifiedPayloadDto,
} from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import {
    BadRequestException,
    forwardRef,
    HttpStatus,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as ms from 'ms';

import { EConfig } from '../../config/interfaces/config.interface';
import { comparePassword } from '../../shared/password';
import { AccountService } from '../account/account.service';
import { CreateAccountRequestDto } from '../account/dtos/create-account-request.dto';
import { GetAccountResponseDto } from '../account/dtos/get-account-response.dto';
import { CreateSessionRequestDto } from '../session/dtos/CreateSessionRequestDto.dto';
import { UpdateSessionRequestDto } from '../session/dtos/UpdateSessionRequestDto.dto';
import { SessionEntity } from '../session/models/session.entity';
import { SessionService } from '../session/session.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,

        @Inject(forwardRef(() => AccountService))
        private readonly accountService: AccountService,
        private readonly sessionService: SessionService,
    ) {}

    async refreshToken(request: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
        let session: SessionEntity;
        if (!request.hash) {
            throw new BadRequestException({
                message: 'Invalid token',
                statusCode: HttpStatus.BAD_REQUEST,
                code: `api-auth-service-ts-refreshToken-error-#0001`,
            } as IErrorResponseDto);
        }

        try {
            session = await this.sessionService.getSessionById(request.sessionId);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                code:
                    error.response.code ||
                    error.code ||
                    `api-auth-service-ts-refreshToken-error-#0002`,
            } as IErrorResponseDto);
        }

        if (!session) {
            throw new BadRequestException({
                message: 'Invalid token',
                statusCode: HttpStatus.BAD_REQUEST,
                code: `api-auth-service-ts-refreshToken-error-#0003`,
            } as IErrorResponseDto);
        }

        const isHashMatch = session.randomHash === request.hash;

        if (!isHashMatch) {
            throw new BadRequestException({
                message: 'Invalid token',
                statusCode: HttpStatus.BAD_REQUEST,
                code: `api-auth-service-ts-refreshToken-error-#0004`,
            } as IErrorResponseDto);
        }

        const hash = session.randomHash;

        let accessToken = '';

        try {
            const tokens = await this.generateTokens({
                email: session.account.email,
                role: session.account.role,
                id: session.account.id,
                hash: hash,
                sessionId: session.id,
            });
            accessToken = tokens.accessToken;
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                code:
                    error.response.code ||
                    error.code ||
                    `api-auth-service-ts-refreshToken-error-#0005`,
            } as IErrorResponseDto);
        }

        const expiresInMinutes =
            ms(this.configService.get(EConfig.ACCESS_TOKEN_EXPIRES_IN)) / 1000 / 60;

        const response: RefreshTokenResponseDto = {
            accessToken,
            expiresInMinutes,
        };

        return response;
    }

    async getUser(user: UserPayloadDto): Promise<GetAccountResponseDto> {
        let accountResponseDto: GetAccountResponseDto;
        try {
            accountResponseDto = await this.accountService.getAccountById(user.id);
        } catch (error) {
            throw new BadRequestException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.NOT_FOUND,
                code:
                    error.response.code || error.code || `api-auth-service-ts-getUser-error-#0001`,
            } as IErrorResponseDto);
        }
        return accountResponseDto;
    }

    async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
        let account: Account;
        try {
            account = await this.accountService.getAccountByEmail(loginDto.email, false);
        } catch (error) {
            throw new BadRequestException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.NOT_FOUND,
                code: error.response.code || error.code || `api-auth-service-ts-login-error-#0001`,
            } as IErrorResponseDto);
        }

        if (!account) {
            throw new BadRequestException({
                message: 'User not found',
                statusCode: HttpStatus.NOT_FOUND,
                code: `api-auth-service-ts-login-error-#0002`,
            } as IErrorResponseDto);
        }

        if (account.isActivated === false) {
            throw new BadRequestException({
                message:
                    'Account is not activated, please check your email to activate the account',
                statusCode: HttpStatus.BAD_REQUEST,
                code: `api-auth-service-ts-login-error-#0003`,
            } as IErrorResponseDto);
        }

        const isPasswordMatch = await comparePassword(loginDto.password, account.hashedPassword);

        if (!isPasswordMatch) {
            throw new BadRequestException({
                message: 'Incorrect password',
                statusCode: HttpStatus.BAD_REQUEST,
                code: `api-auth-service-ts-login-error-#0004`,
            } as IErrorResponseDto);
        }

        const hash = crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');

        let session: SessionEntity;
        try {
            session = await this.sessionService.getSessionByAccountId(account.id);

            if (session === null) {
                const createdSession = new CreateSessionRequestDto();
                createdSession.accountId = account.id;
                createdSession.randomHash = hash;
                session = await this.sessionService.createSession({
                    accountId: account.id,
                    randomHash: hash,
                } as CreateSessionRequestDto);
            } else {
                const updatedSession = new UpdateSessionRequestDto();
                updatedSession.id = session.id;
                updatedSession.randomHash = hash;
                session = await this.sessionService.updateSession(updatedSession);
            }
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                code: error.response.code || error.code || `api-auth-service-ts-login-error-#0005`,
            } as IErrorResponseDto);
        }

        let accessToken = '';
        let refreshToken = '';

        try {
            const tokens = await this.generateTokens({
                email: account.email,
                role: account.role,
                id: account.id,
                hash: hash,
                sessionId: session.id,
            });
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                code: error.response.code || error.code || `api-auth-service-ts-login-error-#0006`,
            } as IErrorResponseDto);
        }

        const expiresInMinutes =
            ms(this.configService.get(EConfig.ACCESS_TOKEN_EXPIRES_IN)) / 1000 / 60;

        const response: LoginResponseDto = {
            accessToken,
            expiresInMinutes,
            refreshToken,
        };

        return response;
    }

    async register(registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
        let account: GetAccountResponseDto;
        try {
            account = (await this.accountService.getAccountByEmail(
                registerDto.email,
                false,
            )) as GetAccountResponseDto;
        } catch (error) {
            throw new BadRequestException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.NOT_FOUND,
                code:
                    error.response.code || error.code || `api-auth-service-ts-register-error-#0001`,
            } as IErrorResponseDto);
        }

        if (account) {
            throw new UnprocessableEntityException({
                message: 'User already exists',
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                code: `api-auth-service-ts-register-error-#0002`,
            } as IErrorResponseDto);
        }

        if (
            registerDto.password.length < 8 ||
            registerDto.password.length > 20 ||
            registerDto.password.includes(' ')
        ) {
            throw new UnprocessableEntityException({
                message: 'Password must be between 8 and 20 characters and not contain spaces',
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                code: `api-auth-service-ts-register-error-#0003`,
            } as IErrorResponseDto);
        }

        if (registerDto.password !== registerDto.confirmPassword) {
            throw new UnprocessableEntityException({
                message: 'Confirm password and password do not match',
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                code: `api-auth-service-ts-register-error-#0004`,
            } as IErrorResponseDto);
        }

        let newAccount: GetAccountResponseDto;
        try {
            newAccount = await this.accountService.createAccount(
                {
                    email: registerDto.email,
                    hashedPassword: registerDto.password,
                    name: registerDto.name,
                    role: registerDto.role,
                } as CreateAccountRequestDto,
                false,
            );
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.response.message || error.message || error,
                statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                code:
                    error.response.code || error.code || `api-auth-service-ts-register-error-#0005`,
            } as IErrorResponseDto);
        }

        const response: RegisterResponseDto = {
            message: `An email has been sent to ${newAccount.email}. Please check your email to activate your account.`,
        };

        return response;
    }

    private async generateTokens(payload: IJwtTransferPayload) {
        const { email, role, id, hash, sessionId } = payload;
        const accessToken = await this.jwtService.signAsync(
            {
                email,
                role,
                id,
            },
            {
                expiresIn: this.configService.get(EConfig.ACCESS_TOKEN_EXPIRES_IN),
                secret: this.configService.get(EConfig.JWT_SECRET_KEY),
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            {
                sessionId,
                hash,
            },
            {
                expiresIn: this.configService.get(EConfig.REFRESH_TOKEN_EXPIRES_IN),
                secret: this.configService.get(EConfig.JWT_REFRESH_SECRET_KEY),
            },
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    async generateVerifiedToken(email: string, accountId: number) {
        const hash = crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');

        const payload: VerifiedPayloadDto = {
            email,
            id: accountId,
            verifiedHash: hash,
        };

        const verifiedToken = await this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get(EConfig.VERIFIED_TOKEN_EXPIRES_IN),
            secret: this.configService.get(EConfig.JWT_SECRET_KEY),
        });

        return {
            verifiedToken: verifiedToken,
            verifiedHash: hash,
        };
    }

    async validateToken(token: string): Promise<any> {
        let payload;

        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get(EConfig.JWT_SECRET_KEY),
            });
        } catch (error) {
            this.logger.error(error);
        }

        return payload;
    }
}
