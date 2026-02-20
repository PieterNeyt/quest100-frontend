import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { DemoAuthService } from '../services/demoAuthService';
import { Observable, of } from 'rxjs';

@Injectable()
export class DemoAwareMsalGuard extends MsalGuard {
  private demoAuth = inject(DemoAuthService);

  override canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    if (this.demoAuth.isDemoUser()) {
      return of(true);
    }
    return super.canActivate(route, state);
  }
}
