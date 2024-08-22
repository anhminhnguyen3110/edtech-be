import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionRequestDto {
    @IsNotEmpty()
    accountId: number;

    @IsNotEmpty()
    @IsString()
    randomHash: string;
}
