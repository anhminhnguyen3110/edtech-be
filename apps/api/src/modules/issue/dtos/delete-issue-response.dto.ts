import { ApiResponseProperty } from '@nestjs/swagger';

export class DeleteIssueResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'Issue deleted successfully',
    })
    message: string;
}
