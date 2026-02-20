import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {HlmNavigationMenuImports} from '@spartan-ng/helm/navigation-menu';
import {MSAL_GUARD_CONFIG, MsalBroadcastService, MsalService} from '@azure/msal-angular';
import {EventMessage, EventType, InteractionStatus, RedirectRequest} from '@azure/msal-browser';
import {filter, Subject, takeUntil} from 'rxjs';
import {ProfileService} from './services/profileService';
import {TranslationService, Language} from './services/translationService';
import {CommonModule} from '@angular/common';
import {NgxSonnerToaster} from 'ngx-sonner';
import {DemoAuthService} from './services/demoAuthService';
import {DemoLoginComponent} from './interceptors/demoLogin';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmNavigationMenuImports, RouterLink, CommonModule, NgxSonnerToaster, DemoLoginComponent],
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
  public translationService = inject(TranslationService);

  public demoAuth = inject(DemoAuthService); // DEMO

  //originele
/*  setLoginDisplay() {
    this.loginDisplay.set(this.authService.instance.getAllAccounts().length > 0);
  }*/

  setLoginDisplay() {
    const hasMsalAccount = this.authService.instance.getAllAccounts().length > 0;
    const hasDemoAccount = this.demoAuth.isDemoUser();
    this.loginDisplay.set(hasMsalAccount || hasDemoAccount);
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

    //DEMO
    if (this.demoAuth.isDemoUser()) {
      this.setLoginDisplay();
    }

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
      //  this.profileService.syncUser(); originele lijn
        if (!this.demoAuth.isDemoUser()) { // DEMO if
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

  //  originele logout
/*  logout(popup?: boolean) {
    if (popup) {
      this.authService.logoutPopup({
        mainWindowRedirectUri: '/',
      });
    } else {
      this.authService.logoutRedirect();
    }
  }*/

  logout() {
    if (this.demoAuth.isDemoUser()) {
      this.logoutDemo();
    } else {
      this.authService.logoutRedirect();
    }
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


// DEMO
  demoLoggedIn() {
    this.setLoginDisplay();
  }

  logoutDemo() {
    this.demoAuth.logout();
    this.setLoginDisplay();
    window.location.pathname = '/';
  }
}
