import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { TargetInfo } from '../model/gotcha';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';
import { GotchaKillFeedComponent } from '../gotcha-kill-feed/gotcha-kill-feed';

@Component({
  selector: 'app-gotcha-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, GotchaKillFeedComponent],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-page.html',
  styleUrl: './gotcha-page.css',
})
export class GotchaPageComponent implements OnInit, OnDestroy {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);

  // ── Submit kill modal ─────────────────────────────────────────────────────
  showSubmitModal = signal(false);
  photoBase64     = signal<string | null>(null);   // the converted base64 string
  photoPreview    = signal<string | null>(null);   // data URI for <img> preview
  submitting      = signal(false);

  // ── Game & player state ───────────────────────────────────────────────────
  myStatus    = this.gotchaService.myStatus;
  currentGame = this.gotchaService.currentGame;
  targetInfo  = this.gotchaService.targetInfo;

  isActive      = computed(() => this.currentGame()?.status === 'ACTIVE');
  isFinished    = computed(() => this.currentGame()?.status === 'FINISHED');
  isAlive       = computed(() => this.myStatus()?.isAlive ?? false);
  hasTarget     = computed(() => !!this.myStatus()?.targetId);
  canSubmitKill = computed(() => this.isActive() && this.isAlive() && this.hasTarget());
  isParticipant = computed(() => !!this.myStatus());

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdown = signal<{ h: number; m: number; s: number } | null>(null);
  private countdownInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.gotchaService.getCurrentGame().subscribe();
    this.gotchaService.getMyStatus().subscribe({
      next: () => {
        if (this.isActive()) {
          this.gotchaService.getTargetInfo().subscribe({
            next: () => this.startCountdown(),
          });
        }
      },
      error: () => { /* not a participant */ },
    });
  }

  ngOnDestroy() { this.stopCountdown(); }

  goBack()        { this.router.navigate(['/event']); }
  goToEndScreen() { this.router.navigate(['/gotcha/end']); }
  goToSettings()  { this.router.navigate(['/gotcha/settings']); }

  // ── Countdown ─────────────────────────────────────────────────────────────

  private startCountdown() {
    this.stopCountdown();
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  private updateCountdown() {
    const deadline = this.targetInfo()?.killDeadline;
    if (!deadline) { this.countdown.set(null); return; }
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs <= 0) { this.countdown.set({ h: 0, m: 0, s: 0 }); return; }
    const totalSecs = Math.floor(diffMs / 1000);
    this.countdown.set({
      h: Math.floor(totalSecs / 3600),
      m: Math.floor((totalSecs % 3600) / 60),
      s: totalSecs % 60,
    });
  }

  get countdownUrgent(): boolean {
    const cd = this.countdown();
    return !!cd && cd.h === 0 && cd.m < 60;
  }
  get countdownCritical(): boolean {
    const cd = this.countdown();
    return !!cd && cd.h === 0 && cd.m < 10;
  }

  padTwo(n: number): string { return n.toString().padStart(2, '0'); }

  // ── Submit kill modal ─────────────────────────────────────────────────────

  openSubmitModal() {
    this.photoBase64.set(null);
    this.photoPreview.set(null);
    this.showSubmitModal.set(true);
  }

  closeSubmitModal() { this.showSubmitModal.set(false); }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      // Store the full data URI for preview, strip the prefix for the backend
      this.photoPreview.set(dataUri);
      this.photoBase64.set(dataUri.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  submitKill() {
    const b64 = this.photoBase64();
    if (!b64) {
      this.toastService.error('gotcha.submitKill.noPhoto');
      return;
    }
    this.submitting.set(true);
    this.gotchaService.submitKill(b64).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeSubmitModal();
        this.toastService.success('gotcha.submitKill.success');
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err?.error?.error ?? 'gotcha.submitKill.error');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  targetInitials(info: TargetInfo): string {
    if (!info.target) return '?';
    return `${info.target.firstName?.[0] ?? ''}${info.target.lastName?.[0] ?? ''}`.toUpperCase();
  }

  targetFullName(info: TargetInfo): string {
    if (!info.target) return '';
    return `${info.target.firstName} ${info.target.lastName}`.trim();
  }

  propName(prop: { nameEN: string; nameNL: string } | null | undefined): string {
    if (!prop) return '';
    return this.t.currentLanguage() === 'nl'
      ? (prop.nameNL || prop.nameEN)
      : (prop.nameEN || prop.nameNL);
  }
}
