import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

import { IErrorResponseDto } from '../interfaces/error.interface';

@Catch(HttpException)
export class CustomHttpExceptionFilter implements ExceptionFilter {
    catch(httpException: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = httpException.getStatus();

        const httpExceptionResponse = httpException.getResponse() as IErrorResponseDto;

        const errorResponse: IErrorResponseDto = {
            statusCode: httpExceptionResponse.statusCode || status,
            message: httpExceptionResponse.message || 'An error occurred',
            code: httpExceptionResponse.code || 'The location of the error is unknown',
        };

        response.status(status).json(errorResponse);
    }
}
