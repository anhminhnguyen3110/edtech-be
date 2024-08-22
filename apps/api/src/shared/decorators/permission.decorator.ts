import { JwtGuard } from '@app/common/auth/guard/jwt.guard';
import { RoleGuard } from '@app/common/auth/guard/role.guard';
import { EGuardDecoratorKey, EGuardPermission } from '@app/common/constants/guard.constant';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const PublicPermission = () => SetMetadata(EGuardDecoratorKey.PUBLIC, true);

export const TeacherGuard = () => SetMetadata(EGuardDecoratorKey.ROLES, EGuardPermission.TEACHER);

export const StudentGuard = () => SetMetadata(EGuardDecoratorKey.ROLES, EGuardPermission.STUDENT);

export const AllowPublic = () => applyDecorators(PublicPermission());

export const RestrictToTeacher = () =>
    applyDecorators(ApiBearerAuth(), TeacherGuard(), UseGuards(JwtGuard, RoleGuard));

export const RestrictToStudent = () =>
    applyDecorators(ApiBearerAuth(), StudentGuard(), UseGuards(JwtGuard, RoleGuard));
