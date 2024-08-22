import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateMailRequestDto {
    @ApiProperty({
        description: "The recipient's email address",
        example: 'user@example.com',
        type: String, // Explicitly setting the type as String
    })
    @IsEmail({}, { message: 'The "to" field must be a valid email address.' })
    @IsNotEmpty({ message: 'The "to" field is required.' })
    to: string;

    @ApiProperty({
        description: 'The email subject',
        example: 'Your weekly newsletter!',
        type: String, // Explicitly setting the type as String
    })
    @IsNotEmpty({ message: 'The subject is required.' })
    subject: string;

    @ApiProperty({
        description: 'The body of the email',
        example: 'Hello, this is your requested newsletter...',
        type: String, // Explicitly setting the type as String
    })
    @IsString({ message: 'The body must be a string.' })
    body: string;
}

export class CreateAccountActivationMailRequestDto {
    @ApiProperty({
        description: 'The recipient email address',
        example: 'nganhminh2000@gmail.com',
        type: String, // Explicitly setting the type as String
    })
    to: string;

    @ApiProperty({
        description: 'The activation link',
        example: 'http://localhost:3000/activate-account?accountId=1',
        type: String,
    })
    activationLink: string;

    @ApiProperty({
        description: 'The token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYzNjQwNjQwM30',
        type: String,
    })
    verifiedToken: string;

    @ApiProperty({
        description: 'The user name',
        example: 'minh',
        type: String,
    })
    userName: string;

    @ApiProperty({
        description: 'The user role',
        example: 'teacher',
        type: String, // Explicitly setting the type as String
    })
    urlClient: string;

    @ApiPropertyOptional({
        description: 'The user id',
        type: Number,
    })
    mailId?: number;

    @ApiProperty({
        description: 'The user id',
        example: '1d',
        type: String,
    })
    expiredIn: string;
}
