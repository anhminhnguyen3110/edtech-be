import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { WsException, WsResponse } from '@nestjs/websockets';

import { IErrorResponseDto } from '../interfaces/error.interface';

@Catch(WsException)
export class CustomWsExceptionFilter implements ExceptionFilter {
    catch(wsException: WsException, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        const wsExceptionResponse = wsException.getError() as IErrorResponseDto;

        const errorResponse: IErrorResponseDto = {
            statusCode: wsExceptionResponse.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
            message: wsExceptionResponse.message || 'An error occurred',
            code: wsExceptionResponse.code || 'The location of the error is unknown',
        };

        client.send(
            JSON.stringify({
                event: 'exception',
                data: errorResponse,
            } as WsResponse<IErrorResponseDto>),
        );
    }
}
