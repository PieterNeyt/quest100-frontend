import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';
import { GotchaKillFeedComponent } from '../components/gotcha-kill-feed/gotcha-kill-feed';
import * as utils from '../utils/gotchaUtils';

@Component({
  selector: 'app-gotcha-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, GotchaKillFeedComponent],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-page.html',
  styleUrl: './gotcha-page.css',
})
export class GotchaPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);
  readonly utils = utils;

  // Submit kill modal
  showSubmitModal = signal(false);
  photoBase64     = signal<string | null>(null);
  photoPreview    = signal<string | null>(null);
  submitting      = signal(false);

  // Game & player state
  myStatus    = this.gotchaService.myStatus;
  currentGame = this.gotchaService.currentGame;
  targetInfo  = this.gotchaService.targetInfo;

  countdown   = this.gotchaService.countdown;

  isActive      = computed(() => this.currentGame()?.status === 'ACTIVE');
  isFinished    = computed(() => this.currentGame()?.status === 'FINISHED');
  isAlive       = computed(() => this.myStatus()?.isAlive ?? false);
  hasTarget     = computed(() => !!this.myStatus()?.targetId);
  isParticipant = computed(() => !!this.myStatus());
  hasPendingKill = computed(() => !!this.myStatus()?.pendingKillAt);

  canSubmitKill = computed(() =>
    this.isActive() && this.isAlive() && this.hasTarget() && !this.hasPendingKill()
  );

  // Urgency status voor de countdown
  get countdownUrgent(): boolean {
    const cd = this.countdown();
    return !!cd && cd.h === 0 && cd.m < 60 && !this.hasPendingKill();
  }
  get countdownCritical(): boolean {
    const cd = this.countdown();
    return !!cd && cd.h === 0 && cd.m < 10 && !this.hasPendingKill();
  }

  ngOnInit() {
    this.gotchaService.getCurrentGame().subscribe();
    this.gotchaService.getMyStatus().subscribe({
      next: () => {
        if (this.isActive()) {
          this.gotchaService.getTargetInfo().subscribe();
        }
      },
      error: () => {},
    });
  }

  goBack()        { this.router.navigate(['/event']); }
  goToEndScreen() { this.router.navigate(['/gotcha/end']); }
  goToSettings()  { this.router.navigate(['/gotcha/settings']); }

  padTwo(n: number): string { return n.toString().padStart(2, '0'); }

  //Submit kill modal logica
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
        this.gotchaService.getMyStatus().subscribe();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err?.error?.error ?? 'gotcha.submitKill.error');
      },
    });
  }
}
