import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

interface IApiControllerInfoParam {
    name: string;
}

export const ApiSwaggerController = (data: IApiControllerInfoParam) => {
    const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    return applyDecorators(Controller(data.name), ApiTags(capitalizedName));
};
