/*
    Author: Anh Minh Nguyen
    Created Date: 14-06-2024
    Modified Date: 14-06-2024
    Description: Create config interface
*/

export interface IConfig {
    APP_NAME: string;

    ASSIGNMENT_HOST: string;
    ASSIGNMENT_PORT: number;
    ASSIGNMENT_HTTP_PORT: number;

    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
}

export enum EConfig {
    APP_NAME = 'APP_NAME',

    ASSIGNMENT_HOST = 'ASSIGNMENT_HOST',
    ASSIGNMENT_PORT = 'ASSIGNMENT_PORT',
    ASSIGNMENT_HTTP_PORT = 'ASSIGNMENT_HTTP_PORT',

    DB_TYPE = 'DB_TYPE',
    DB_HOST = 'DB_HOST',
    DB_PORT = 'DB_PORT',
    DB_USERNAME = 'DB_USERNAME',
    DB_PASSWORD = 'DB_PASSWORD',
    DB_NAME = 'DB_NAME',
}
