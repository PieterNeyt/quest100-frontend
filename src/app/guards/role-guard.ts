import {CanActivateFn, RedirectCommand, Router} from '@angular/router';
import {inject} from '@angular/core';
import {RoleService} from '../services/roleService';

export const roleGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const expectedRole = route.data['role'];
  const router = inject(Router);

  if (roleService.hasRole(expectedRole)) {
    return true;
  }

  return new RedirectCommand(router.parseUrl("/forbidden"), {skipLocationChange: true,});
};
