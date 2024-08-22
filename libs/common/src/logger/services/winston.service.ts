import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

import { ELogColors, ELogLevel, ILogData } from '../logger/interfaces/log-data.interface';
import ILogger from '../logger/interfaces/logger.interface';
import { colorize, mapLogLevelColor } from './helper';

import DailyRotateFile = require('winston-daily-rotate-file');

@Injectable()
export default class WinstonLogger implements ILogger {
    private readonly logger: winston.Logger;

    public constructor() {
        const logLevel: any = {};
        let cont = 0;
        Object.values(ELogLevel).forEach(level => {
            logLevel[level] = cont;
            cont++;
        });

        this.logger = winston.createLogger({
            level: 'debug',
            levels: logLevel,
            format: this.loggerFormat(),
            transports: [this.createConsoleTransport(), this.createFileTransport()],
            exceptionHandlers: [this.createConsoleTransport(), this.createFileTransport()],
            rejectionHandlers: [this.createConsoleTransport(), this.createFileTransport()],
        });
    }

    private loggerFormat() {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'DD/MM/YYYY, HH:mm:ss',
            }),
            winston.format.errors({ stack: true }),
            winston.format(info => {
                if (info.error && info.error instanceof Error) {
                    info.stack = info.error.stack;
                    info.error = undefined;
                }

                info.label = `${info.organization}.${info.app}`;

                return info;
            })(),
            winston.format.metadata({
                key: 'data',
                fillExcept: ['timestamp', 'level', 'message'],
            }),
            winston.format.json(),
        );
    }

    private createConsoleTransport() {
        return new winston.transports.Console({
            format: winston.format.combine(
                winston.format.printf(log => {
                    const color = mapLogLevelColor(log.level as ELogLevel);
                    const prefix = log.data.label ? `[${log.data.label}]` : '';
                    const sourceClass = log.data.sourceClass
                        ? `${colorize(ELogColors.white, `[${log.data.sourceClass}]`)}`
                        : '';
                    const errorMessage = log.data.error ? log.data.error : '';
                    const duration =
                        log.data.durationMs !== undefined
                            ? colorize(color, ` +${log.data.durationMs}ms`)
                            : '';
                    const stackTrace = log.data.stack
                        ? colorize(color, `  - ${log.data.stack}`)
                        : '';
                    const prop = log.data.prop
                        ? `\n  - Prop: ${JSON.stringify(log.data.prop, null, 4)}`
                        : '';

                    return `${colorize(color, `${prefix}  -`)} ${log.timestamp} ${colorize(
                        color,
                        log.level.toUpperCase(),
                    )} ${sourceClass} ${colorize(
                        color,
                        `${log.message} - ${errorMessage}`,
                    )}${duration}${stackTrace}${prop}`;
                }),
            ),
        });
    }

    private createFileTransport() {
        return new DailyRotateFile({
            dirname: 'logs',
            filename: 'log-%DATE%.log',
            maxSize: '1d',
            maxFiles: '7d',
        });
    }

    public async log(level: ELogLevel, message: string | Error, data?: ILogData): Promise<void> {
        const logData = {
            level: level,
            message: message instanceof Error ? message.message : message,
            error: message instanceof Error ? message : undefined,
            ...data,
        };

        this.logger.log(logData);
    }

    public async debug(message: string, data?: ILogData): Promise<void> {
        await this.log(ELogLevel.Debug, message, data);
    }

    public async info(message: string, data?: ILogData): Promise<void> {
        await this.log(ELogLevel.Info, message, data);
    }

    public async warn(message: string | Error, data?: ILogData): Promise<void> {
        await this.log(ELogLevel.Warn, message, data);
    }

    public async error(message: string | Error, data?: ILogData): Promise<void> {
        await this.log(ELogLevel.Error, message, data);
    }

    public async fatal(message: string | Error, data?: ILogData): Promise<void> {
        await this.log(ELogLevel.Fatal, message, data);
    }

    public async emergency(message: string | Error, data?: ILogData): Promise<void> {
        await this.log(ELogLevel.Emergency, message, data);
    }
}
