/*
    Author: Anh Minh Nguyen
    Created Date: 14-06-2024
    Modified Date: 14-06-2024
    Description: Create config interface
*/
import { commonValidationSchema } from '@app/common/config/validate/config.validate';

import { IConfig } from '../interfaces/config.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Joi = require('joi');

export const configuration = (): IConfig => ({
    APP_NAME: process.env.APP_NAME,

    QUIZ_HOST: process.env.QUIZ_HOST,
    QUIZ_PORT: parseInt(process.env.QUIZ_PORT) || 8082,
    QUIZ_HTTP_PORT: parseInt(process.env.QUIZ_HTTP_PORT) || 8182,
    QUIZ_WS_PORT: parseInt(process.env.QUIZ_WS_PORT) || 8282,

    DB_TYPE: process.env.DB_TYPE,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 3306),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    MAXIMUM_QUESTIONS_PER_QUIZ: parseInt(process.env.MAXIMUM_QUESTIONS_PER_QUIZ, 100),

    QUIZ_MAX_SCORE_BANK: parseInt(process.env.QUIZ_MAX_SCORE_BANK, 100),
    BASE_SCORE_REWARD_FOR_CORRECT_ANSWER: parseInt(
        process.env.BASE_SCORE_REWARD_FOR_CORRECT_ANSWER,
        10,
    ),
    STRIKE_IMPACT_ON_SCORE: parseInt(process.env.STRIKE_IMPACT_ON_SCORE, 5),
});

// Specific validation schema
const specificValidationSchema = Joi.object({
    APP_NAME: Joi.string().required(),

    QUIZ_HOST: Joi.string().required(),
    QUIZ_PORT: Joi.number().required(),
    QUIZ_HTTP_PORT: Joi.number().required(),
    QUIZ_WS_PORT: Joi.number().required(),

    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),

    MAXIMUM_QUESTIONS_PER_QUIZ: Joi.number().required(),
    QUIZ_MAX_SCORE_BANK: Joi.number().required(),
    BASE_SCORE_REWARD_FOR_CORRECT_ANSWER: Joi.number().required(),
    STRIKE_IMPACT_ON_SCORE: Joi.number().required(),
});

export const validationSchema = commonValidationSchema.concat(specificValidationSchema);
