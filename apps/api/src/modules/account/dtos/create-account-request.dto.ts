import { ERole } from '@app/common/constants/role.constant';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAccountRequestDto {
    @ApiProperty({
        description: 'The email address of the account',
        example: 'user@example.com',
        type: String,
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The password for the account',
        example: 'strongPassword123',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    hashedPassword: string;

    @ApiProperty({
        description: 'The name of the account holder',
        example: 'John Doe',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The role of the account',
        example: ERole.TEACHER,
        enum: ERole,
        type: ERole,
    })
    @IsEnum(ERole)
    @IsOptional()
    role: ERole = ERole.TEACHER;
}

export class ReactivateAccountRequestDto {
    @ApiProperty({
        description: 'The email address of the account',
        example: 'minh124ds124@gmail.com',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    accountEmail: string;
}
