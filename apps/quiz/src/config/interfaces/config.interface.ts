/*
    Author: Anh Minh Nguyen
    Created Date: 14-06-2024
    Modified Date: 14-06-2024
    Description: Create config interface
*/

export interface IConfig {
    APP_NAME: string;

    QUIZ_HOST: string;
    QUIZ_PORT: number;
    QUIZ_HTTP_PORT: number;
    QUIZ_WS_PORT: number;

    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;

    MAXIMUM_QUESTIONS_PER_QUIZ: number;
    QUIZ_MAX_SCORE_BANK: number;
    BASE_SCORE_REWARD_FOR_CORRECT_ANSWER: number;
    STRIKE_IMPACT_ON_SCORE: number;
}

export enum EConfig {
    APP_NAME = 'APP_NAME',

    QUIZ_HOST = 'QUIZ_HOST',
    QUIZ_PORT = 'QUIZ_PORT',
    QUIZ_HTTP_PORT = 'QUIZ_HTTP_PORT',
    QUIZ_WS_PORT = 'QUIZ_WS_PORT',

    DB_TYPE = 'DB_TYPE',
    DB_HOST = 'DB_HOST',
    DB_PORT = 'DB_PORT',
    DB_USERNAME = 'DB_USERNAME',
    DB_PASSWORD = 'DB_PASSWORD',
    DB_NAME = 'DB_NAME',

    MAXIMUM_QUESTIONS_PER_QUIZ = 'MAXIMUM_QUESTIONS_PER_QUIZ',
    QUIZ_MAX_SCORE_BANK = 'QUIZ_MAX_SCORE_BANK',
    BASE_SCORE_REWARD_FOR_CORRECT_ANSWER = 'BASE_SCORE_REWARD_FOR_CORRECT_ANSWER',
    STRIKE_IMPACT_ON_SCORE = 'STRIKE_IMPACT_ON_SCORE',
}
