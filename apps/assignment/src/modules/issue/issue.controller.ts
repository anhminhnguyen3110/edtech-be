import { ECommandIssue } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
    CreateIssueRequestDto,
    ExtractIssuesRequestDto,
} from 'apps/api/src/modules/issue/dtos/create-issue-request.dto';
import { CreateIssueResponseDto } from 'apps/api/src/modules/issue/dtos/create-issue-response.dto';
import { DeleteIssueResponseDto } from 'apps/api/src/modules/issue/dtos/delete-issue-response.dto';
import { GetIssueResponseDto } from 'apps/api/src/modules/issue/dtos/get-issue-response.dto';
import { UpdateIssueRequestDto } from 'apps/api/src/modules/issue/dtos/update-issue-request.dto';
import { UpdateIssueResponseDto } from 'apps/api/src/modules/issue/dtos/update-issue-response.dto';

import { IssueService } from './issue.service';

@Controller()
export class IssueController {
    constructor(private readonly issueService: IssueService) {}

    @MessagePattern(ECommandIssue.CREATE_ISSUE)
    async createIssue(
        @Payload()
        data: {
            createIssueRequestDto: CreateIssueRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<CreateIssueResponseDto> {
        return this.issueService.createIssue(data.createIssueRequestDto, data.userPayload);
    }

    @MessagePattern(ECommandIssue.UPDATE_ISSUE)
    async updateIssue(
        @Payload()
        data: {
            id: number;
            updateIssueRequestDto: UpdateIssueRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<UpdateIssueResponseDto> {
        return this.issueService.updateIssue(data.id, data.updateIssueRequestDto, data.userPayload);
    }

    @MessagePattern(ECommandIssue.REMOVE_ISSUE)
    async deleteIssue(
        @Payload() data: { id: number; userPayload: UserPayloadDto },
    ): Promise<DeleteIssueResponseDto> {
        return this.issueService.deleteIssue(data.id, data.userPayload);
    }

    @MessagePattern(ECommandIssue.FIND_ALL_ISSUES)
    async getAllIssues(
        @Payload()
        data: {
            classAssignmentId: number;
            userPayload: UserPayloadDto;
        },
    ): Promise<GetIssueResponseDto[]> {
        return this.issueService.getAllIssues(data.classAssignmentId, data.userPayload);
    }

    @EventPattern(ECommandIssue.EXTRACT_ISSUES)
    async extractIssues(
        @Payload()
        data: {
            extractIssuesRequestDto: ExtractIssuesRequestDto;
            userPayload: UserPayloadDto;
        },
    ): Promise<void> {
        return this.issueService.extractIssues(data);
    }

    @EventPattern(ECommandIssue.SAVE_EXTRACTED_ISSUES)
    async saveExtractedIssues(
        @Payload()
        data: {
            issues: CreateIssueRequestDto[];
            accountId: number;
        },
    ): Promise<void> {
        return this.issueService.saveExtractedIssues(data);
    }
}
