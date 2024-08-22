/*
    Author: Anh Minh Nguyen
    Created Date: 14-06-2024
    Modified Date: 14-06-2024
    Description: Create config interface
*/

export interface IConfig {
    APP_NAME: string;

    BACKGROUND_JOB_HOST: string;
    BACKGROUND_JOB_PORT: number;
    BACKGROUND_JOB_HTTP_PORT: number;

    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
}

export enum EConfig {
    APP_NAME = 'APP_NAME',

    BACKGROUND_JOB_HOST = 'BACKGROUND_JOB_HOST',
    BACKGROUND_JOB_PORT = 'BACKGROUND_JOB_PORT',
    BACKGROUND_JOB_HTTP_PORT = 'BACKGROUND_JOB_HTTP_PORT',

    DB_TYPE = 'DB_TYPE',
    DB_HOST = 'DB_HOST',
    DB_PORT = 'DB_PORT',
    DB_USERNAME = 'DB_USERNAME',
    DB_PASSWORD = 'DB_PASSWORD',
    DB_NAME = 'DB_NAME',
}
