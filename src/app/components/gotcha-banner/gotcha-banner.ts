import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideChevronRight,
  lucideClock,
  lucidePlus,
  lucideSettings2,
  lucideShieldCheck,
  lucideSwords,
  lucideTarget,
  lucideTrophy,
  lucideZap
} from '@ng-icons/lucide';
import {GotchaService} from '../../services/gotchaService';
import {TranslationService} from '../../services/translationService';
import {ToastService} from '../../services/toastService';
import {FullNamePipe, InitialsPipe, PhotoSrcPipe} from '../../utils/gotchaPipes';

@Component({
  selector: 'app-gotcha-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, FullNamePipe, InitialsPipe, PhotoSrcPipe, NgIconComponent,],
  providers: [
    provideIcons({
      lucideTrophy,
      lucideArrowRight,
      lucideTarget,
      lucideSwords,
      lucideClock,
      lucideShieldCheck,
      lucideZap,
      lucideSettings2,
      lucideChevronRight,
      lucidePlus
    })
  ],
  templateUrl: './gotcha-banner.html',
  styleUrl: './gotcha-banner.css',
})
export class GotchaBannerComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);

  loading = signal(true);
  acting  = signal(false);

  myStatus    = this.gotchaService.myStatus;
  currentGame = this.gotchaService.currentGame;
  endScreen   = this.gotchaService.endScreen;
  serviceCd   = this.gotchaService.countdown;

  isOptedIn    = computed(() => this.myStatus() !== null);
  gameStatus   = computed(() => this.currentGame()?.status ?? null);
  isFinished   = computed(() => this.gameStatus() === 'FINISHED');
  hasStartDate = computed(() => !!this.currentGame()?.startDate);
  timeLeft = computed(() => {
    const cd = this.serviceCd();
    if (!cd) return null;
    return { days: Math.floor(cd.h / 24), hours: cd.h % 24, minutes: cd.m, seconds: cd.s };
  });

  canOptOut = computed(() => this.isOptedIn() && this.gameStatus() === 'OPT_IN');

  ngOnInit() { this.loadAll(); }

  navigateToEndScreen() { this.router.navigate(['/gotcha/end']); }
  navigateToGotcha()    { this.router.navigate(['/gotcha']); }
  navigateToSettings()  { this.router.navigate(['/gotcha/settings']); }

  private loadAll() {
    this.loading.set(true);
    this.gotchaService.getCurrentGame().subscribe({
      next: () => {
        if (this.isFinished()) this.gotchaService.getEndScreen().subscribe();
        this.gotchaService.getMyStatus().subscribe({
          next: () => this.loading.set(false),
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  optIn() {
    this.acting.set(true);
    this.gotchaService.optIn().subscribe({
      next: () => {
        this.gotchaService.getMyStatus().subscribe({
          next: () => {
            this.acting.set(false);
            this.toastService.success('gotcha.toasts.optedIn');
          },
          error: () => this.acting.set(false),
        });
      },
      error: (err) => {
        this.acting.set(false);
        this.toastService.error(err?.status === 409 ? 'gotcha.toasts.alreadyOptedIn' : 'gotcha.toasts.optInError');
      },
    });
  }

  optOut() {
    this.acting.set(true);
    this.gotchaService.optOut().subscribe({
      next: () => {
        this.gotchaService.myStatus.set(null);
        this.acting.set(false);
        this.toastService.success('gotcha.toasts.optedOut');
      },
      error: () => {
        this.acting.set(false);
        this.toastService.error('gotcha.toasts.optOutError');
      },
    });
  }

  pad(n: number): string { return String(n).padStart(2, '0'); }
}
