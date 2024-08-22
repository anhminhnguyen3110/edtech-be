import {
    ArgumentsHost,
    Catch,
    HttpException,
    HttpStatus,
    RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';

@Catch(RpcException)
export class CustomRpcExceptionFilter implements RpcExceptionFilter<RpcException> {
    catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message || 'Internal Server Error';

        response.status(status).json({
            statusCode: status,
            message: message,
            error: exception.name,
        });

        return throwError(
            () =>
                new RpcException({
                    statusCode: status,
                    message,
                }),
        );
    }
}
