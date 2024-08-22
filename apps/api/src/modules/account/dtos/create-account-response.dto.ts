import { ERole } from '@app/common/constants/role.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

export class CreateAccountResponseDto {
    @ApiResponseProperty({
        example: 1,
        type: Number,
    })
    id: number;

    @ApiResponseProperty({
        example: 'user@example.com',
        type: String,
    })
    email: string;

    @ApiResponseProperty({
        example: 'John Doe',
        type: String,
    })
    name: string;

    @ApiResponseProperty({
        example: 'USER',
        enum: ERole,
        type: ERole,
    })
    role: ERole;

    @ApiResponseProperty({
        example: false,
        type: Boolean,
    })
    isActivated: boolean;
}
