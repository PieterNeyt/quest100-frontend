import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {Router} from '@angular/router';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {GotchaService} from '../services/gotchaService';
import {GotchaParticipant, KillFeedProfile, KillFeedProp} from '../model/gotcha';
import {TranslationService} from '../services/translationService';
import {ToastService} from '../services/toastService';
import {GotchaKillFeedComponent} from '../components/gotcha-kill-feed/gotcha-kill-feed';
import {ProfileService} from '../services/profileService';
import {FullNamePipe, InitialsPipe, PhotoSrcPipe, PropNamePipe, StatusClassPipe,} from '../utils/gotchaPipes';

@Component({
  selector: 'app-gotcha-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, GotchaKillFeedComponent, FullNamePipe, InitialsPipe, PhotoSrcPipe, PropNamePipe, StatusClassPipe,],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-page.html',
  styleUrl: './gotcha-page.css',
})
export class GotchaPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService  = inject(ToastService);
  private readonly profileService = inject(ProfileService);
  private readonly router        = inject(Router);
  private readonly location      = inject(Location);
  readonly t = inject(TranslationService);
  @ViewChild(GotchaKillFeedComponent) killFeed?: GotchaKillFeedComponent;
  // Submit kill modal
  showSubmitModal = signal(false);
  photoBase64     = signal<string | null>(null);
  submitting      = signal(false);

  // Game & player state
  private myStatus    = this.gotchaService.myStatus;
  currentGame = this.gotchaService.currentGame;
  targetInfo  = this.gotchaService.targetInfo;
  countdown   = this.gotchaService.countdown;

  // Leaderboard voor alive count
  private participants = signal<GotchaParticipant[]>([]);

  aliveCount = computed(() =>
    this.participants().filter(p => p.isAlive).length
  );
  totalCount = computed(() => this.participants().length);

  isActive      = computed(() => this.currentGame()?.status === 'ACTIVE');
  isFinished    = computed(() => this.currentGame()?.status === 'FINISHED');
  isAlive       = computed(() => this.myStatus()?.isAlive ?? false);
  private hasTarget     = computed(() => !!this.myStatus()?.targetId);
  isParticipant = computed(() => !!this.myStatus());
  hasPendingKill = computed(() => !!this.myStatus()?.pendingKillAt);

  killerInfo = signal<KillFeedProfile | null>(null);
  killerProp = signal<KillFeedProp | null>(null);

  canSubmitKill = computed(() =>
    this.isActive() && this.isAlive() && this.hasTarget() && !this.hasPendingKill()
  );

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
          this.loadLeaderboard();
          if (!this.isAlive()) {
            this.loadKillerInfo();
          }
        }
      },
      error: () => {
        if (this.isActive()) {
          this.loadLeaderboard();
        }
      },
    });
  }

  private loadLeaderboard() {
    this.gotchaService.getLeaderboard().subscribe({
      next: (data) => this.participants.set(data),
      error: () => {},
    });
  }

  goBack() {
    this.location.back();
  }
  goToEndScreen() { this.router.navigate(['/gotcha/end']); }
  goToSettings()  { this.router.navigate(['/gotcha/settings']); }
  goToHistory()   { this.router.navigate(['/gotcha/history']); }

  padTwo(n: number): string { return n.toString().padStart(2, '0'); }

  openSubmitModal() {
    this.photoBase64.set(null);
    this.showSubmitModal.set(true);
  }

  closeSubmitModal() { this.showSubmitModal.set(false); }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      this.photoBase64.set(dataUri.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  private loadKillerInfo() {
    const killedBy = this.myStatus()?.killedBy;
    if (!killedBy) return;

    this.profileService.getProfileById(killedBy).subscribe({
      next: (profile) => {
        this.killerInfo.set({
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.customProfilePicture ?? undefined,
        });
      },
      error: () => {},
    });
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
        this.loadLeaderboard();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err?.error?.error ?? 'gotcha.submitKill.error');
      },
    });
  }
}
