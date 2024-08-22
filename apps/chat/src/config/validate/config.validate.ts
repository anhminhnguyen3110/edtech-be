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

    CHAT_HOST: process.env.CHAT_HOST,
    CHAT_PORT: parseInt(process.env.CHAT_PORT),
    CHAT_HTTP_PORT: parseInt(process.env.CHAT_HTTP_PORT),

    DB_TYPE: process.env.DB_TYPE,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 3306),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    MAXIMUM_TOPIC: parseInt(process.env.MAXIMUM_TOPIC),
    MAXIMUM_MESSAGE: parseInt(process.env.MAXIMUM_MESSAGE),
});

// Specific validation schema
const specificValidationSchema = Joi.object({
    APP_NAME: Joi.string().required(),

    CHAT_HOST: Joi.string().required(),
    CHAT_PORT: Joi.number().required(),
    CHAT_HTTP_PORT: Joi.number().required(),

    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),

    MAXIMUM_TOPIC: Joi.number().required(),
    MAXIMUM_MESSAGE: Joi.number().required(),
});

export const validationSchema = commonValidationSchema.concat(specificValidationSchema);
