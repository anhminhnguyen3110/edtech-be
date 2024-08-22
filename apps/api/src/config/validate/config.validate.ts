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
    API_PREFIX: process.env.API_PREFIX,
    SWAGGER_PATH: process.env.SWAGGER_PATH,

    API_HOST: process.env.API_HOST,
    API_PORT: parseInt(process.env.API_PORT),
    API_SOCKET_PORT: parseInt(process.env.API_SOCKET_PORT) || 8180,

    DB_TYPE: process.env.DB_TYPE,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 3306),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    JWT_REFRESH_SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    VERIFIED_TOKEN_EXPIRES_IN: process.env.VERIFIED_TOKEN_EXPIRES_IN,
});

// Specific validation schema
const specificValidationSchema = Joi.object({
    APP_NAME: Joi.string().required(),
    API_PREFIX: Joi.string().required(),
    SWAGGER_PATH: Joi.string().required(),

    API_HOST: Joi.string().required(),
    API_PORT: Joi.number().required(),
    API_SOCKET_PORT: Joi.number().required(),

    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),

    JWT_SECRET_KEY: Joi.string().required(),
    JWT_REFRESH_SECRET_KEY: Joi.string().required(),
    ACCESS_TOKEN_EXPIRES_IN: Joi.string().required(),
    REFRESH_TOKEN_EXPIRES_IN: Joi.string().required(),
    VERIFIED_TOKEN_EXPIRES_IN: Joi.string().required(),
});

export const validationSchema = commonValidationSchema.concat(specificValidationSchema);
