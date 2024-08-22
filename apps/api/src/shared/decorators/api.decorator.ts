import { applyDecorators, HttpCode, HttpStatus, Type } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

interface IApiInfoParam {
    status?: HttpStatus;
    summary: string;
    response?: string | Function | Type<unknown> | [Function];
}

export const ApiSwaggerInfo = (data: IApiInfoParam) =>
    applyDecorators(
        HttpCode(data.status || HttpStatus.OK),
        ApiOperation({ summary: data.summary }),
        ApiResponse({
            status: data.status,
            type: data.response,
        }),
    );
