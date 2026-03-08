import {Component, computed, inject, OnDestroy, OnInit, signal,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {GotchaService} from '../services/gotchaService';
import {TargetInfo} from '../model/gotcha';
import {TranslationService} from '../services/translationService';
import {ToastService} from '../services/toastService';
import {GotchaKillFeedComponent} from '../gotcha-kill-feed/gotcha-kill-feed';

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
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  // ── submit kill modal ─────────────────────────
  showSubmitModal = signal(false);
  photoUrl = signal('');
  submitting = signal(false);

  // ── edit game modal ───────────────────────────
  showEditModal = signal(false);
  editStartDate = signal('');
  editKillDeadline = signal(72);
  editPrizePhotoBase64 = signal('');
  editPrizePhotoPreview = signal('');
  editPrizeDescEN = signal('');
  editPrizeDescNL = signal('');
  editSaving = signal(false);

  // ── game & player state ───────────────────────
  myStatus    = this.gotchaService.myStatus;
  currentGame = this.gotchaService.currentGame;
  targetInfo  = this.gotchaService.targetInfo;

  isActive      = computed(() => this.currentGame()?.status === 'ACTIVE');
  isFinished    = computed(() => this.currentGame()?.status === 'FINISHED');
  isOptIn       = computed(() => this.currentGame()?.status === 'OPT_IN');
  isAlive       = computed(() => this.myStatus()?.isAlive ?? false);
  hasTarget     = computed(() => !!this.myStatus()?.targetId);
  canSubmitKill = computed(() => this.isActive() && this.isAlive() && this.hasTarget());
  isParticipant = computed(() => !!this.myStatus());

  // ── countdown ─────────────────────────────────
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

  // ── countdown ─────────────────────────────────
  private startCountdown() {
    this.stopCountdown();
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = undefined; }
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
    const cd = this.countdown(); return !!cd && cd.h === 0 && cd.m < 60;
  }
  get countdownCritical(): boolean {
    const cd = this.countdown(); return !!cd && cd.h === 0 && cd.m < 10;
  }
  padTwo(n: number): string { return n.toString().padStart(2, '0'); }

  // ── submit kill modal ─────────────────────────
  openSubmitModal()  { this.photoUrl.set(''); this.showSubmitModal.set(true); }
  closeSubmitModal() { this.showSubmitModal.set(false); }

  submitKill() {
    if (!this.photoUrl().trim()) { this.toastService.error('gotcha.submitKill.noPhoto'); return; }
    this.submitting.set(true);
    this.gotchaService.submitKill(this.photoUrl().trim()).subscribe({
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

  // ── edit game modal (single source of truth for all game settings) ────────
  openEditModal() {
    const game = this.currentGame();

    // Default to current date/time if no start date is set yet
    const defaultDate = game?.startDate
      ? new Date(game.startDate)
      : new Date(); // ← NOW as default

    this.editStartDate.set(this.toDatetimeLocal(defaultDate));
    this.editKillDeadline.set(game?.killDeadlineHours ?? 72);
    this.editPrizePhotoBase64.set(game?.prizePhotoBase64 ?? '');
    this.editPrizePhotoPreview.set(
      game?.prizePhotoBase64 ? `data:image/jpeg;base64,${game.prizePhotoBase64}` : ''
    );
    this.editPrizeDescEN.set(game?.prizeDescriptionEN ?? '');
    this.editPrizeDescNL.set(game?.prizeDescriptionNL ?? '');
    this.showEditModal.set(true);
  }
  closeEditModal() { this.showEditModal.set(false); }

  onPrizeFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.editPrizePhotoBase64.set(result.split(',')[1]);
      this.editPrizePhotoPreview.set(result);
    };
    reader.readAsDataURL(file);
  }

  clearPrizePhoto() { this.editPrizePhotoBase64.set(''); this.editPrizePhotoPreview.set(''); }

  saveEditModal() {
    if (!this.editStartDate()) { this.toastService.error('gotcha.editModal.startDateRequired'); return; }
    this.editSaving.set(true);
    this.gotchaService.updateStartDate({
      startDate: new Date(this.editStartDate()).toISOString(),
      killDeadlineHours: this.editKillDeadline(),
      prizePhotoBase64: this.editPrizePhotoBase64(),
      prizeDescriptionEN: this.editPrizeDescEN(),
      prizeDescriptionNL: this.editPrizeDescNL(),
    }).subscribe({
      next: () => { this.editSaving.set(false); this.closeEditModal(); this.toastService.success('success.saved'); },
      error: () => { this.editSaving.set(false); this.toastService.error('errors.generic'); },
    });
  }

  // ── helpers ───────────────────────────────────
  targetInitials(info: TargetInfo): string {
    if (!info.target) return '?';
    return `${info.target.firstName?.[0] ?? ''}${info.target.lastName?.[0] ?? ''}`.toUpperCase();
  }

  targetFullName(info: TargetInfo): string {
    if (!info.target) return '';
    return `${info.target.firstName} ${info.target.lastName}`.trim();
  }

  private toDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
