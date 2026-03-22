import {inject, Injectable, signal} from '@angular/core';
import {BehaviorSubject, filter, Subject, takeUntil} from 'rxjs';
import {environment} from '../../environments/environment';
import {jwtDecode} from 'jwt-decode';
import {InteractionStatus} from '@azure/msal-browser';
import {MsalBroadcastService, MsalService} from '@azure/msal-angular';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  roles = signal<string[]>([]);

  private rolesLoadedSubject = new BehaviorSubject<boolean>(false);
  rolesLoaded$ = this.rolesLoadedSubject.asObservable();

  private _destroying$ = new Subject<void>();
  private msalBroadcastService = inject(MsalBroadcastService);
  private authService = inject(MsalService);

  constructor() {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(async () => {
        const accounts = this.authService.instance.getAllAccounts();

        if (accounts.length === 0) {
          this.rolesLoadedSubject.next(true);
          return;
        }

        try {
          const account = this.authService.instance.getActiveAccount() || accounts[0];

          const tokenResponse = await this.authService.instance.acquireTokenSilent({
            account,
            scopes: environment.apiConfig.scopes
          });

          const decoded: any = jwtDecode(tokenResponse.accessToken);
          this.roles.set(decoded.roles || []);

        } catch (error) {
          this.roles.set([]);
        } finally {
          this.rolesLoadedSubject.next(true);
        }
      });
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }
}
