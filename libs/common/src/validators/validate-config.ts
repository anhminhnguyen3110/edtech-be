import { plainToClass } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';
import { validateSync } from 'class-validator';

function validateConfig<T extends object>(
    config: Record<string, unknown>,
    envVariablesClass: ClassConstructor<T>,
) {
    const validatedConfig = plainToClass(envVariablesClass, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        const errorMessage = errors.map(error => Object.values(error.constraints)).join('\n');
        throw new Error(errorMessage);
    }
    return validatedConfig;
}

export default validateConfig;
