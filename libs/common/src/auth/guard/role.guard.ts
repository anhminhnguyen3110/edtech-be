import { EGuardDecoratorKey } from '@app/common/constants/guard.constant';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>(EGuardDecoratorKey.ROLES, context.getHandler());
        if (!roles) {
            return true;
        }

        const user = context.switchToHttp().getRequest().user;
        return roles.includes(user?.role);
    }
}
