import { PartialType } from '@nestjs/swagger';

import { CreateAccountResponseDto } from './create-account-response.dto';

export class GetAccountResponseDto extends PartialType(CreateAccountResponseDto) {}
