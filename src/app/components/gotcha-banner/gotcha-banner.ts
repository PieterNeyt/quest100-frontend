import {
  Component,
  computed,
  inject,
  OnDestroy,
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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-gotcha-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-banner.html',
  styleUrl: './gotcha-banner.css',
})
export class GotchaBannerComponent implements OnInit, OnDestroy {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  loading = signal(true);
  acting = signal(false);

  timeLeft = signal<TimeLeft | null>(null);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  endScreen   = this.gotchaService.endScreen;

  isOptedIn    = computed(() => this.gotchaService.myStatus() !== null);
  gameStatus   = computed(() => this.gotchaService.currentGame()?.status ?? null);
  isFinished   = computed(() => this.gameStatus() === 'FINISHED');

  hasStartDate = computed(() => {
    const game = this.gotchaService.currentGame();
    if (!game?.startDate) return false;
    const d = new Date(game.startDate);
    return !isNaN(d.getTime()) && d.getFullYear() > 2000;
  });

  canOptOut = computed(() =>
    this.isOptedIn() && this.gotchaService.currentGame()?.status === 'OPT_IN'
  );

  winner = computed(() => this.endScreen()?.winner ?? null);

  winnerName = computed(() => {
    const w = this.winner();
    return w ? `${w.firstName} ${w.lastName}`.trim() : '';
  });

  winnerInitials = computed(() => {
    const w = this.winner();
    if (!w) return '?';
    return `${w.firstName?.[0] ?? ''}${w.lastName?.[0] ?? ''}`.toUpperCase();
  });

  winnerKillCount = computed(() => this.endScreen()?.winnerKillCount ?? 0);

  ngOnInit() { this.loadAll(); }
  ngOnDestroy() { this.clearTimer(); }

  navigateToEndScreen() { this.router.navigate(['/gotcha/end']); }
  navigateToGotcha()    { this.router.navigate(['/gotcha']); }

  private loadAll() {
    this.loading.set(true);
    this.gotchaService.getCurrentGame().subscribe({
      next: () => {
        this.startCountdown();
        if (this.isFinished()) {
          this.gotchaService.getEndScreen().subscribe();
        }
        this.gotchaService.getMyStatus().subscribe({
          next: () => this.loading.set(false),
          error: () => this.loading.set(false),
        });
      },
      error: () => { this.loading.set(false); },
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
            this.gotchaService.getCurrentGame().subscribe({
              next: () => this.startCountdown(),
              error: () => {},
            });
          },
          error: () => this.acting.set(false),
        });
      },
      error: (err) => {
        this.acting.set(false);
        if (err?.status === 409) {
          this.toastService.error('gotcha.toasts.alreadyOptedIn');
        } else {
          this.toastService.error('gotcha.toasts.optInError');
        }
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
        if (err?.error?.error === 'cannot opt out after game has started') {
          this.toastService.error('gotcha.toasts.optOutGameStarted');
        } else {
          this.toastService.error('gotcha.toasts.optOutError');
        }
      },
    });
  }

  private startCountdown() {
    this.clearTimer();
    const game = this.gotchaService.currentGame();
    if (!game?.startDate) return;
    const target = new Date(game.startDate).getTime();
    if (isNaN(target) || target <= 0) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        this.timeLeft.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        this.clearTimer();
        return;
      }
      this.timeLeft.set({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    this.timerInterval = setInterval(tick, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  pad(n: number): string { return String(n).padStart(2, '0'); }
}
