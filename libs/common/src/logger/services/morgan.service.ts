import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as morgan from 'morgan';

import { ELogColors } from '../logger/interfaces/log-data.interface';
import { colorize } from './helper';

@Injectable()
export class MorganMiddleware implements NestMiddleware {
    private format: string;
    private propertyColor: ELogColors = ELogColors.white;
    private valueColor: ELogColors = ELogColors.yellow;

    constructor() {
        this.format = `[${colorize(ELogColors.white, 'Edtech-Assistant.API')}]  - ${colorize(
            this.propertyColor,
            'remote-addr',
        )}: ${colorize(this.valueColor, ':remote-addr')} | ${colorize(
            this.propertyColor,
            'user',
        )}: ${colorize(this.valueColor, ':user')} | ${colorize(
            this.propertyColor,
            'method',
        )}: ${colorize(this.valueColor, ':method')} | ${colorize(
            this.propertyColor,
            'url',
        )}: ${colorize(this.valueColor, ':url')} | ${colorize(
            this.propertyColor,
            'res-status',
        )}: ${colorize(this.valueColor, ':status')} | ${colorize(
            this.propertyColor,
            'response-time',
        )}: ${colorize(this.valueColor, ':response-time ms')} | ${colorize(
            this.propertyColor,
            'query',
        )}: ${colorize(this.valueColor, ':query-params')} | ${colorize(
            this.propertyColor,
            'body',
        )}: ${colorize(this.valueColor, ':body')}`;

        morgan.token('user', (req: any) => {
            if (req?.user && req?.user?.email) {
                return `[User: ${req?.user?.email}]`;
            }
            return '[User: Anonymous]';
        });

        morgan.token('query-params', (req: Request) => `${JSON.stringify(req.query || {})}`);
        morgan.token('body', (req: Request) => `${JSON.stringify(req.body || {})}`);

        morgan.format('custom', (tokens, req: Request, res: Response) => {
            const fn = morgan.compile(this.format);
            return fn(tokens, req, res);
        });
    }

    use(req: Request, res: Response, next: NextFunction) {
        morgan('custom')(req, res, next);
    }
}
