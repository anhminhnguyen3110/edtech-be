import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Body, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { CreateIssueRequestDto, ExtractIssuesRequestDto } from './dtos/create-issue-request.dto';
import { CreateIssueResponseDto, ExtractIssuesResponseDto } from './dtos/create-issue-response.dto';
import { DeleteIssueResponseDto } from './dtos/delete-issue-response.dto';
import { GetIssueResponseDto } from './dtos/get-issue-response.dto';
import { UpdateIssueRequestDto } from './dtos/update-issue-request.dto';
import { UpdateIssueResponseDto } from './dtos/update-issue-response.dto';
import { IssueService } from './issue.service';

@ApiSwaggerController({
    name: EApiRoute.ISSUE,
})
@RestrictToTeacher()
export class IssueController {
    constructor(
        private readonly issueService: IssueService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Create an issue',
        response: CreateIssueResponseDto,
    })
    async createIssue(
        @Body() createIssueRequestDto: CreateIssueRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ): Promise<CreateIssueResponseDto> {
        const response = await this.issueService.createIssue(createIssueRequestDto, userPayload);

        await this.redisService.delPatternSpecific(`${EApiRoute.ISSUE}_${userPayload.id}`);

        return response;
    }

    @Put(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Update an issue',
        response: UpdateIssueResponseDto,
    })
    async updateIssue(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateIssueRequestDto: UpdateIssueRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ): Promise<UpdateIssueResponseDto> {
        const response = await this.issueService.updateIssue(
            id,
            updateIssueRequestDto,
            userPayload,
        );

        await this.redisService.delPatternSpecific(`${EApiRoute.ISSUE}_${userPayload.id}_`);

        return response;
    }

    @Delete(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Delete an issue',
        response: DeleteIssueResponseDto,
    })
    async deleteIssue(
        @Param('id', ParseIntPipe) id: number,
        @UserPayload() userPayload: UserPayloadDto,
    ): Promise<DeleteIssueResponseDto> {
        const response = await this.issueService.deleteIssue(id, userPayload);

        await this.redisService.delPatternSpecific(`${EApiRoute.ISSUE}_${userPayload.id}_`);

        return response;
    }

    @Get(':classAssignmentId')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get all issues',
        response: GetIssueResponseDto,
    })
    async getAllIssues(
        @Param('classAssignmentId', ParseIntPipe) classAssignmentId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ): Promise<GetIssueResponseDto[]> {
        const cacheKey = `${EApiRoute.ISSUE}_${userPayload.id}_${classAssignmentId}`;
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) return cachedData;

        const response = await this.issueService.getAllIssues(classAssignmentId, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Post('extract-issues')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Extract issues',
        response: ExtractIssuesResponseDto,
    })
    async extractIssues(
        @Body() extractIssuesRequestDto: ExtractIssuesRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.issueService.extractIssues(extractIssuesRequestDto, userPayload);
    }
}
