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
import {environment} from '../../environment/environment';
import {TranslationService, Language} from './services/translationService';
import {CommonModule} from '@angular/common';
import {NgxSonnerToaster} from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmNavigationMenuImports, RouterLink, HlmButtonImports, HlmIconImports, HlmDropdownMenuImports, HlmAvatarImports, NgOptimizedImage, CommonModule, NgxSonnerToaster],
  providers: [
    provideIcons({lucideUser, lucideSettings, lucideLogOut})
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  loginDisplay = signal(false);
  isIframe = signal(false);
  showLanguageDropdown = signal(false);

  private readonly _destroying$ = new Subject<void>();
  private msalGuardConfig = inject(MSAL_GUARD_CONFIG);
  private authService = inject(MsalService);
  private profileService = inject(ProfileService);
  private msalBroadcastService = inject(MsalBroadcastService);
  profile = this.profileService.profile;
  public translationService = inject(TranslationService);

  private setLoginDisplay() {
    this.loginDisplay.set(this.authService.instance.getAllAccounts().length > 0);
  }

  private checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();

    if (
      !activeAccount &&
      this.authService.instance.getAllAccounts().length > 0
    ) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
    }
  }

  private tryAutoLogin() {
    const alreadyTried = sessionStorage.getItem('autoLoginAttempted');
    if (alreadyTried) return;
    sessionStorage.setItem('autoLoginAttempted', 'true');

    this.authService.loginRedirect({
      scopes: environment.apiConfig.scopes,
      prompt: 'none'
    });
  }

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe({
      error: (error: any) => {
        if (error?.name === 'InteractionRequiredAuthError') {
          return;
        }
        console.error('Unexpected redirect error:', error);
      },
    });

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
        } else {
          sessionStorage.removeItem('autoLoginAttempted');
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
        const accounts = this.authService.instance.getAllAccounts();

        if (accounts.length === 0) {
          this.tryAutoLogin();
        } else {
          this.setLoginDisplay();
          this.checkAndSetActiveAccount();
          this.profileService.syncUser();
        }
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


  logout() {
    this.authService.logoutRedirect();
  }

  async changeLanguage(lang: Language): Promise<void> {
    await this.translationService.setLanguage(lang);
    this.showLanguageDropdown.set(false);
  }

  toggleLanguageDropdown(): void {
    this.showLanguageDropdown.update(val => !val);
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
