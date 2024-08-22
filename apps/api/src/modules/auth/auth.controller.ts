import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { RefreshTokenDto, UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Body, Get, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { GetAccountResponseDto } from '../account/dtos/get-account-response.dto';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';

@ApiSwaggerController({ name: EApiRoute.AUTH })
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    @Post('login')
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'This endpoint is used to login to the application.',
        response: LoginResponseDto,
    })
    async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'This endpoint is used to register a new user.',
        response: RegisterResponseDto,
    })
    async register(@Body() registerDto: RegisterRequestDto) {
        return this.authService.register(registerDto);
    }

    @Post('refresh-token')
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'This endpoint is used to refresh the token.',
        response: RefreshTokenResponseDto,
    })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt-refresh'))
    async refreshToken(@UserPayload() request: RefreshTokenDto) {
        return this.authService.refreshToken(request);
    }

    @Get('account')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'This endpoint is used to get the current user and test the auth feature.',
        response: GetAccountResponseDto,
    })
    @RestrictToTeacher()
    async teacher(@UserPayload() user: UserPayloadDto) {
        const cacheKey = `${EApiRoute.AUTH}_${user.id}`;
        const cacheData = await this.redisService.get(cacheKey);
        if (cacheData) return cacheData;

        const response = await this.authService.getUser(user);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }
}
