export enum ELogLevel {
    Emergency = 'emergency', // One or more systems are unusable.
    Fatal = 'fatal', // A person must take an action immediately
    Error = 'error', // Error events are likely to cause problems
    Warn = 'warn', // Warning events might cause problems in the future and deserve eyes
    Info = 'info', // Routine information, such as ongoing status or performance
    Debug = 'debug', // Debug or trace information
}

export interface ILogData {
    organization?: string; // Organization or project name
    app?: string; // Application or Microservice name
    sourceClass?: string; // Class name of the source
    error?: Error; // Error object
    prop?: NodeJS.Dict<any>; // Additional properties
}

export enum ELogColors {
    red = '\x1b[31m',
    green = '\x1b[32m',
    yellow = '\x1b[33m',
    blue = '\x1b[34m',
    magenta = '\x1b[35m',
    cyan = '\x1b[36m',
    pink = '\x1b[38;5;206m',
    white = '\x1b[37m',
}
