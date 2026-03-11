import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../../services/gotchaService';
import { TranslationService } from '../../services/translationService';
import { ToastService } from '../../services/toastService';
import * as utils from '../../utils/gotchaUtils';

@Component({
  selector: 'app-gotcha-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-banner.html',
  styleUrl: './gotcha-banner.css',
})
export class GotchaBannerComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);

  readonly utils = utils;

  loading = signal(true);
  acting  = signal(false);

  private myStatus    = this.gotchaService.myStatus;
  private currentGame = this.gotchaService.currentGame;
  private endScreen   = this.gotchaService.endScreen;
  private serviceCd   = this.gotchaService.countdown;

  isOptedIn    = computed(() => this.myStatus() !== null);
  gameStatus   = computed(() => this.currentGame()?.status ?? null);
  isFinished   = computed(() => this.gameStatus() === 'FINISHED');


  timeLeft = computed(() => {
    const cd = this.serviceCd();
    if (!cd) return null;

    return {
      days:    Math.floor(cd.h / 24),
      hours:   cd.h % 24,
      minutes: cd.m,
      seconds: cd.s
    };
  });

  hasStartDate = computed(() => {
    const game = this.currentGame();
    return !!game?.startDate;
  });

  canOptOut = computed(() =>
    this.isOptedIn() && this.gameStatus() === 'OPT_IN'
  );

  winner          = computed(() => this.endScreen()?.winner ?? null);
  winnerName      = computed(() => utils.fullName(this.winner()));
  winnerInitials  = computed(() => utils.initials(this.winner()));
  winnerKillCount = computed(() => this.endScreen()?.winnerKillCount ?? 0);

  ngOnInit() {
    this.loadAll();
  }

  navigateToEndScreen() { this.router.navigate(['/gotcha/end']); }
  navigateToGotcha()    { this.router.navigate(['/gotcha']); }
  navigateToSettings()  { this.router.navigate(['/gotcha/settings']); }

  private loadAll() {
    this.loading.set(true);
    this.gotchaService.getCurrentGame().subscribe({
      next: () => {
        if (this.isFinished()) {
          this.gotchaService.getEndScreen().subscribe();
        }
        this.gotchaService.getMyStatus().subscribe({
          next:  () => this.loading.set(false),
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
      error: (err) => {
        this.acting.set(false);
        const msg = err?.error?.error === 'cannot opt out after game has started'
          ? 'gotcha.toasts.optOutGameStarted'
          : 'gotcha.toasts.optOutError';
        this.toastService.error(msg);
      },
    });
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
