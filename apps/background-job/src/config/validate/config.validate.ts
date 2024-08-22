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

    BACKGROUND_JOB_HOST: process.env.BACKGROUND_JOB_HOST,
    BACKGROUND_JOB_PORT: parseInt(process.env.BACKGROUND_JOB_PORT),
    BACKGROUND_JOB_HTTP_PORT: parseInt(process.env.BACKGROUND_JOB_HTTP_PORT),

    DB_TYPE: process.env.DB_TYPE,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 3306),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
});

// Specific validation schema
const specificValidationSchema = Joi.object({
    APP_NAME: Joi.string().required(),

    BACKGROUND_JOB_HOST: Joi.string().required(),
    BACKGROUND_JOB_PORT: Joi.number().required(),
    BACKGROUND_JOB_HTTP_PORT: Joi.number().required(),

    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
});

export const validationSchema = commonValidationSchema.concat(specificValidationSchema);
