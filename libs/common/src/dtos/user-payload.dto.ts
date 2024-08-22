import { ERole } from '@app/common/constants/role.constant';
import { ApiProperty, PickType } from '@nestjs/swagger';

export class UserPayloadDto {
    @ApiProperty({
        type: Number,
        description: 'The account id of the user',
        example: 1,
    })
    id: number;

    @ApiProperty({
        type: String,
        description: 'The username of the user',
        example: 'minh@gmail.com',
    })
    email: string;

    @ApiProperty({
        type: ERole,
        description: 'The role of the user',
        example: ERole.TEACHER,
    })
    role: string;

    @ApiProperty({
        type: Number,
        description: 'Issued at time of the token',
        example: 1718832394,
    })
    iat: number;

    @ApiProperty({
        type: Number,
        description: 'Expiration time of the token',
        example: 1718918794,
    })
    exp: number;
}

export class RefreshTokenDto extends PickType(UserPayloadDto, ['iat', 'exp']) {
    @ApiProperty({
        type: Number,
        description: 'The account id of the user',
        example: 1,
    })
    sessionId: number;

    @ApiProperty({
        type: String,
        description: 'The hash of the user',
        example: 'hash',
    })
    hash: string;
}

export class VerifiedPayloadDto extends PickType(UserPayloadDto, ['id', 'email']) {
    @ApiProperty({
        type: String,
        description: 'The verified hash of the user',
        example: 'hash',
    })
    verifiedHash: string;
}
