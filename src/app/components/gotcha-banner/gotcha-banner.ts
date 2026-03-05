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
import { ProfileService } from '../../services/profileService';
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
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  loading = signal(true);
  acting = signal(false);
  showEditModal = signal(false);
  saving = signal(false);

  editStartDate = signal('');
  editKillDeadlineHours = signal(72);

  timeLeft = signal<TimeLeft | null>(null);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  currentGame = this.gotchaService.currentGame;
  myStatus = this.gotchaService.myStatus;

  isOptedIn = computed(() => this.gotchaService.myStatus() !== null);

  hasStartDate = computed(() => {
    const game = this.gotchaService.currentGame();
    if (!game?.startDate) return false;
    const d = new Date(game.startDate);
    return !isNaN(d.getTime()) && d.getFullYear() > 2000;
  });

  gameStatus = computed(() => this.gotchaService.currentGame()?.status ?? null);

  canOptOut = computed(() =>
    this.isOptedIn() && this.gotchaService.currentGame()?.status === 'OPT_IN'
  );

  ngOnInit() {
    this.loadAll();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  navigateToGotcha() {
    if (this.showEditModal()) return;
    this.router.navigate(['/gotcha']);
  }

  private loadAll() {
    this.loading.set(true);

    this.gotchaService.getCurrentGame().subscribe({
      next: () => this.startCountdown(),
      error: () => {},
    });

    this.gotchaService.getMyStatus().subscribe({
      next: () => this.loading.set(false),
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

  openEditModal() {
    const game = this.gotchaService.currentGame();
    if (game?.startDate) {
      const d = new Date(game.startDate);
      this.editStartDate.set(this.toDatetimeLocal(d));
      this.editKillDeadlineHours.set(game.killDeadlineHours ?? 72);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.editStartDate.set(this.toDatetimeLocal(tomorrow));
      this.editKillDeadlineHours.set(72);
    }
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  saveStartDate() {
    if (!this.editStartDate()) {
      this.toastService.error('gotcha.toasts.noStartDate');
      return;
    }
    this.saving.set(true);
    this.gotchaService
      .updateStartDate({
        startDate: new Date(this.editStartDate()).toISOString(),
        killDeadlineHours: this.editKillDeadlineHours(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeEditModal();
          this.startCountdown();
          this.toastService.success('gotcha.toasts.startDateSaved');
        },
        error: () => {
          this.saving.set(false);
          this.toastService.error('gotcha.toasts.startDateError');
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
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    this.timerInterval = setInterval(tick, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private toDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
