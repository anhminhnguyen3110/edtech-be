import { OmitType } from '@nestjs/swagger';

import { LoginResponseDto } from './login-response.dto';

export class RefreshTokenResponseDto extends OmitType(LoginResponseDto, ['refreshToken']) {}
