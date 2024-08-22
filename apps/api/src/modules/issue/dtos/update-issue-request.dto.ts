import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateIssueRequestDto } from './create-issue-request.dto';

export class UpdateIssueRequestDto extends PartialType(
    OmitType(CreateIssueRequestDto, ['classAssignmentId']),
) {}
