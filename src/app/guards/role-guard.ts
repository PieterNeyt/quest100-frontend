import {CanActivateFn, RedirectCommand, Router} from '@angular/router';
import {inject} from '@angular/core';
import {RoleService} from '../services/roleService';
import {filter, map, take} from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const expectedRole = route.data['role'];
  const router = inject(Router);

  return roleService.rolesLoaded$.pipe(
    filter(isLoaded => isLoaded),
    take(1),
    map(() => {
      if (roleService.hasRole(expectedRole)) {
        return true;
      }

      return new RedirectCommand(router.parseUrl("/"));
    })
  );
};
