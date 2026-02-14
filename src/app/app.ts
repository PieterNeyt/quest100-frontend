import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {HlmNavigationMenuImports} from '@spartan-ng/helm/navigation-menu';
import {MSAL_GUARD_CONFIG, MsalBroadcastService, MsalService} from '@azure/msal-angular';
import {EventMessage, EventType, InteractionStatus, RedirectRequest} from '@azure/msal-browser';
import {filter, Subject, takeUntil} from 'rxjs';
import {ProfileService} from './services/profileService';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {NgOptimizedImage} from '@angular/common';
import {provideIcons} from '@ng-icons/core';
import {lucideLogOut, lucideSettings, lucideUser} from '@ng-icons/lucide';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmNavigationMenuImports, RouterLink, HlmButtonImports, HlmIconImports, HlmDropdownMenuImports, HlmAvatarImports, NgOptimizedImage],
  providers: [
    provideIcons({lucideUser, lucideSettings, lucideLogOut})
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  loginDisplay = signal(false);
  isIframe = signal(false);
  private readonly _destroying$ = new Subject<void>();
  private msalGuardConfig = inject(MSAL_GUARD_CONFIG);
  private authService = inject(MsalService)
  private profileService = inject(ProfileService)
  private msalBroadcastService = inject(MsalBroadcastService);
  profile = this.profileService.profile;

  setLoginDisplay() {
    this.loginDisplay.set(this.authService.instance.getAllAccounts().length > 0);
  }

  checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();

    if (
      !activeAccount &&
      this.authService.instance.getAllAccounts().length > 0
    ) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
    }
  }

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe();
    this.isIframe.set(window !== window.parent && !window.opener);
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACTIVE_ACCOUNT_CHANGED
        )
      )
      .subscribe(() => {
        if (this.authService.instance.getAllAccounts().length === 0) {
          window.location.pathname = '/';
          this.profileService.syncUser()
        } else {
          this.setLoginDisplay();
        }
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.setLoginDisplay();
        this.checkAndSetActiveAccount();
        this.profileService.syncUser();
      });
  }

  login() {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({
        ...this.msalGuardConfig.authRequest,
      } as RedirectRequest);
    } else {
      this.authService.loginRedirect();
    }
  }


  logout(popup?: boolean) {
    if (popup) {
      this.authService.logoutPopup({
        mainWindowRedirectUri: '/',
      });
    } else {
      this.authService.logoutRedirect();
    }
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
