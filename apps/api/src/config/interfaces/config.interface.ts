/*
    Author: Anh Minh Nguyen
    Created Date: 14-06-2024
    Modified Date: 14-06-2024
    Description: Create config interface
*/

export interface IConfig {
    APP_NAME: string;
    API_PREFIX: string;
    SWAGGER_PATH: string;

    API_HOST: string;
    API_PORT: number;
    API_SOCKET_PORT: number;

    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;

    JWT_SECRET_KEY: string;
    JWT_REFRESH_SECRET_KEY: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    VERIFIED_TOKEN_EXPIRES_IN: string;
}

export enum EConfig {
    APP_NAME = 'APP_NAME',
    API_PREFIX = 'API_PREFIX',
    SWAGGER_PATH = 'SWAGGER_PATH',

    API_HOST = 'API_HOST',
    API_PORT = 'API_PORT',
    API_SOCKET_PORT = 'API_SOCKET_PORT',

    DB_TYPE = 'DB_TYPE',
    DB_HOST = 'DB_HOST',
    DB_PORT = 'DB_PORT',
    DB_USERNAME = 'DB_USERNAME',
    DB_PASSWORD = 'DB_PASSWORD',
    DB_NAME = 'DB_NAME',

    JWT_SECRET_KEY = 'JWT_SECRET_KEY',
    JWT_REFRESH_SECRET_KEY = 'JWT_REFRESH_SECRET_KEY',
    ACCESS_TOKEN_EXPIRES_IN = 'ACCESS_TOKEN_EXPIRES_IN',
    REFRESH_TOKEN_EXPIRES_IN = 'REFRESH_TOKEN_EXPIRES_IN',
    VERIFIED_TOKEN_EXPIRES_IN = 'VERIFIED_TOKEN_EXPIRES_IN',
}
