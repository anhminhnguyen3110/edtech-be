import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
    @ApiProperty({
        type: String,
        description: 'The email of the user',
        example: 'minh12312@gmail.com',
    })
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    @Transform(({ value }) => value.trim())
    email: string;

    @ApiProperty({
        type: String,
        description: 'The password of the user',
        example: 'password',
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}
