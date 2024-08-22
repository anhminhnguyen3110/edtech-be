import { EApiRoute } from '@app/common/constants/route.constants';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { Body, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { generateHtmlResponse } from './account.helper';
import { AccountService } from './account.service';
import { ReactivateAccountRequestDto } from './dtos/create-account-request.dto';
import { GetAccountRequestDto } from './dtos/get-account-request.dto';
import { GetAccountResponseDto } from './dtos/get-account-response.dto';

@ApiSwaggerController({ name: EApiRoute.ACCOUNT })
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    @Get()
    @ApiSwaggerInfo({
        summary: 'This endpoint is used to get accounts.',
        status: HttpStatus.OK,
        response: PaginationResponseDto<GetAccountResponseDto>,
    })
    @RestrictToTeacher()
    async getAccounts(@Query() getAccountsDto: GetAccountRequestDto) {
        return await this.accountService.getAccounts(getAccountsDto);
    }

    @Get('activate-account')
    @ApiSwaggerInfo({
        summary: 'This endpoint is used to activate account.',
        status: HttpStatus.OK,
        response: 'Success',
    })
    async activateAccount(@Query('verifiedToken') verifiedToken: string, @Res() res: any) {
        let result;
        try {
            result = await this.accountService.activateAccount(verifiedToken);
        } catch (error) {
            result = error;
        }

        const htmlResponse = generateHtmlResponse(result);

        res.send(htmlResponse);
    }

    @Post('reactivate-account')
    @ApiSwaggerInfo({
        summary: 'This endpoint is used to reactivate account.',
        status: HttpStatus.OK,
        response: 'Success',
    })
    async reactivateAccount(@Body() reactivateAccountDto: ReactivateAccountRequestDto) {
        return await this.accountService.reactivateAccount(reactivateAccountDto);
    }
}
