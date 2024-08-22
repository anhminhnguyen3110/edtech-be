import { EGuardDecoratorKey } from '@app/common/constants/guard.constant';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.get<boolean>(
            EGuardDecoratorKey.PUBLIC,
            context.getHandler(),
        );
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
}
