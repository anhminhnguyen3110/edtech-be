import { ApiResponseProperty } from '@nestjs/swagger';

import { CreateIssueResponseDto } from './create-issue-response.dto';

export class UpdateIssueResponseDto extends CreateIssueResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Description',
    })
    description: string;
}
