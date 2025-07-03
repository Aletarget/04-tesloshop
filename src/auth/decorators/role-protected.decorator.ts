import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces';

export const RoleProtected = (...args: ValidRoles[]) => {
    const META_ROLES = 'roles'
    return SetMetadata(META_ROLES, args)
}
