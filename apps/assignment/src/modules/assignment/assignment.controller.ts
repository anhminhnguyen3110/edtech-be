import { ECommandAssignment } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetAssignmentRequestDto } from 'apps/api/src/modules/assignment/dtos/get-assignment-request.dto';
import {
    GetAssignmentDetailResponseDto,
    GetAssignmentResponseDto,
} from 'apps/api/src/modules/assignment/dtos/get-assignment-response.dto';

import { AssignmentService } from './assignment.service';

@Controller()
export class AssignmentController {
    constructor(private readonly assignmentService: AssignmentService) {}

    @MessagePattern(ECommandAssignment.FIND_ONE_ASSIGNMENT)
    async handleGetAssignmentDetail(
        @Payload() data: { id: number; userPayload: UserPayloadDto },
    ): Promise<GetAssignmentDetailResponseDto> {
        return this.assignmentService.getAssignmentDetail(data.id, data.userPayload);
    }

    @MessagePattern(ECommandAssignment.FIND_ALL_ASSIGNMENTS)
    async handleGetAssignments(
        @Payload()
        data: {
            getAssignmentRequestDto: GetAssignmentRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<PaginationResponseDto<GetAssignmentResponseDto>> {
        return this.assignmentService.getAssignments(
            data.getAssignmentRequestDto,
            data.userPayload,
        );
    }
}
