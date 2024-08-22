import { ApiResponseProperty } from '@nestjs/swagger';

export class LoginResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'eyJhbGci',
    })
    accessToken: string;

    @ApiResponseProperty({
        type: Number,
        example: 3600,
    })
    expiresInMinutes: number;

    @ApiResponseProperty({
        type: String,
        example: 'eyJhbGci',
    })
    refreshToken: string;
}
