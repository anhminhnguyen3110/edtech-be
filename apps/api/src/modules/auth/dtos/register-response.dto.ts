import { ApiResponseProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
    @ApiResponseProperty({
        type: String,
        example:
            'An email has been sent to nganhminh@gmail.com. Please check your email to activate your account.',
    })
    message: string;
}
