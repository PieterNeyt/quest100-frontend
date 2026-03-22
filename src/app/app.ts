import {Component, HostListener, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {HlmNavigationMenuImports} from '@spartan-ng/helm/navigation-menu';
import {MSAL_GUARD_CONFIG, MsalBroadcastService, MsalService} from '@azure/msal-angular';
import {EventMessage, EventType, InteractionStatus, RedirectRequest} from '@azure/msal-browser';
import {filter, Subject, takeUntil} from 'rxjs';
import {ProfileService} from './services/profileService';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {CommonModule} from '@angular/common';
import {provideIcons} from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideLogOut,
  lucideMenu,
  lucideQrCode,
  lucideSettings,
  lucideUser,
  lucideX,
  lucideZap,
  lucideHelpCircle, lucideGamepad2, lucideCalculator, lucideGrid3x3, lucideBrain, lucideChevronDown
} from '@ng-icons/lucide';
import {environment} from '../environments/environment';
import {Language, TranslationService} from './services/translationService';
import {NgxSonnerToaster} from 'ngx-sonner';
import {jwtDecode} from 'jwt-decode';
import {RoleService} from './services/roleService';
import {TourService} from './services/tourService';
import {GotchaStateService} from './services/GotchaStateService';
import {Role} from './model/role';

type MenuState = 'languages' | 'user' | 'mobile' | 'minigames' | null;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HlmNavigationMenuImports, RouterLink, HlmIconImports, HlmAvatarImports, CommonModule, NgxSonnerToaster],
  providers: [
    provideIcons({
      lucideUser,
      lucideSettings,
      lucideLogOut,
      lucideQrCode,
      lucideMenu,
      lucideX,
      lucideZap,
      lucideChevronRight,
      lucideHelpCircle,
      lucideGamepad2,
      lucideCalculator,
      lucideGrid3x3,
      lucideBrain,
      lucideChevronDown,
    })
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  loginDisplay = signal(false);
  isIframe = signal(false);
  showLanguageDropdown = signal(false);
  activeMenu = signal<MenuState>(null);
  private readonly gotchaState = inject(GotchaStateService);
  private readonly tourService = inject(TourService);
  private readonly router = inject(Router);

  private readonly _destroying$ = new Subject<void>();
  private msalGuardConfig = inject(MSAL_GUARD_CONFIG);
  private authService = inject(MsalService);
  private profileService = inject(ProfileService);
  private msalBroadcastService = inject(MsalBroadcastService);
  profile = this.profileService.profile;
  roleService = inject(RoleService);
  public translationService = inject(TranslationService);
  public role = Role;

  private setLoginDisplay() {
    this.loginDisplay.set(this.authService.instance.getAllAccounts().length > 0);
  }

  private checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();
    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
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
        console.error(error);
      },
    });

    this.isIframe.set(window !== window.parent && !window.opener);
    this.msalBroadcastService.msalSubject$
      .pipe(filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS || msg.eventType === EventType.ACTIVE_ACCOUNT_CHANGED))
      .subscribe(() => {
        if (this.authService.instance.getAllAccounts().length === 0) {
          window.location.pathname = '/';
        } else {
          sessionStorage.removeItem('autoLoginAttempted');
          this.setLoginDisplay();
        }
      });

    this.msalBroadcastService.inProgress$
      .pipe(filter((status: InteractionStatus) => status === InteractionStatus.None), takeUntil(this._destroying$))
      .subscribe(async () => {
        const accounts = this.authService.instance.getAllAccounts();
        if (accounts.length === 0) {
          this.tryAutoLogin();
        } else {
          this.setLoginDisplay();
          this.checkAndSetActiveAccount();
          this.profileService.syncUser();
          const account = this.authService.instance.getActiveAccount();
          if (!account) return;
          const tokenResponse = await this.authService.instance.acquireTokenSilent({
            account,
            scopes: environment.apiConfig.scopes
          });
          const decoded: any = jwtDecode(tokenResponse.accessToken);
          this.roleService.roles.set(decoded.roles || []);
        }
      });
  }

  login() {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest);
    } else {
      this.authService.loginRedirect();
    }
  }

  logout() {
    this.authService.logoutRedirect();
    this.roleService.roles.set([])
  }

  async changeLanguage(lang: Language): Promise<void> {
    await this.translationService.setLanguage(lang);
    this.showLanguageDropdown.set(false);
  }

  toggleMenu(menu: MenuState, event?: Event): void {
    event?.stopPropagation();
    this.activeMenu.update(current => current === menu ? null : menu);
  }

  startContextualTour(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const path = urlTree.root.children['primary']?.segments.map(s => s.path).join('/') || '';

    if (path.startsWith('event/')) {
      this.tourService.startEventDetailTour();
    } else if (path === 'event') {
      this.tourService.startEventTour();
    } else if (path === 'reports/dashboard') {
      this.tourService.startModerationTour();
    } else if (path === 'avatar') {
      this.tourService.startAvatarTour();
    } else if (path === 'about') {
      this.tourService.startAboutTour();
    } else if (path.startsWith('report/')) {
      if (path.includes('/award/')) this.tourService.startReportAwardTour();
      else if (path.includes('/event/')) this.tourService.startReportEventTour();
      else if (path.includes('/message/')) this.tourService.startReportMessageTour();
    } else if (path === 'gotcha/history') {
      this.tourService.startGotchaHistoryTour();
    } else if (path === 'gotcha/end' || path.startsWith('gotcha/end/')) {
      this.tourService.startGotchaEndTour();
    } else if (path === 'gotcha/settings') {
      this.tourService.startGotchaSettingsTour();
    } else if (path === 'gotcha') {
      const activeTab = this.gotchaState.activeTab();

      if (activeTab === 'feed') {
        this.tourService.startGotchaFeedTour();
      } else if (activeTab === 'review') {
        this.tourService.startGotchaReviewTour();
      } else {
        this.tourService.startGotchaRulesTour();
      }
    } else if (path === 'profile') {
      this.tourService.startProfileTour();
    } else if (path === 'kudo-overview') {
      this.tourService.startKudoOverviewTour();
    }
  }

  @HostListener('document:click')
  closeAll(): void {
    this.activeMenu.set(null);
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
