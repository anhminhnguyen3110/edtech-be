import { ERole } from '@app/common/constants/role.constant';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { LoginRequestDto } from './login-request.dto';

export class RegisterRequestDto extends PartialType(LoginRequestDto) {
    @ApiProperty({
        description: 'The name of the user',
        type: String,
        example: 'John Doe',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'The password of the user',
        type: String,
        example: 'password',
    })
    @IsNotEmpty()
    @IsString()
    confirmPassword: string;

    @ApiPropertyOptional({
        description: 'The role of the user',
        type: String,
        example: ERole.TEACHER,
    })
    @IsOptional()
    @IsString()
    role: ERole = ERole.TEACHER;
}
