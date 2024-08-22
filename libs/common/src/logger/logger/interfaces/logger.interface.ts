import { ELogLevel, ILogData } from './log-data.interface';

export default interface ILogger {
    log(level: ELogLevel, message: string | Error, data?: ILogData): Promise<void>;
    debug(message: string, data?: ILogData): Promise<void>;
    info(message: string, data?: ILogData): Promise<void>;
    warn(message: string | Error, data?: ILogData): Promise<void>;
    error(message: string | Error, data?: ILogData): Promise<void>;
    fatal(message: string | Error, data?: ILogData): Promise<void>;
    emergency(message: string | Error, data?: ILogData): Promise<void>;
}
