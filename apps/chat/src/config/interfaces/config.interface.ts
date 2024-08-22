/*
    Author: Anh Minh Nguyen
    Created Date: 14-06-2024
    Modified Date: 14-06-2024
    Description: Create config interface
*/

export interface IConfig {
    APP_NAME: string;

    CHAT_HOST: string;
    CHAT_PORT: number;
    CHAT_HTTP_PORT: number;

    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;

    MAXIMUM_TOPIC: number;
    MAXIMUM_MESSAGE: number;
}

export enum EConfig {
    APP_NAME = 'APP_NAME',

    CHAT_HOST = 'CHAT_HOST',
    CHAT_PORT = 'CHAT_PORT',
    CHAT_HTTP_PORT = 'CHAT_HTTP_PORT',

    DB_TYPE = 'DB_TYPE',
    DB_HOST = 'DB_HOST',
    DB_PORT = 'DB_PORT',
    DB_USERNAME = 'DB_USERNAME',
    DB_PASSWORD = 'DB_PASSWORD',
    DB_NAME = 'DB_NAME',

    MAXIMUM_TOPIC = 'MAXIMUM_TOPIC',
    MAXIMUM_MESSAGE = 'MAXIMUM_MESSAGE',
}
