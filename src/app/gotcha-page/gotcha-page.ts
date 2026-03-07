import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { KillFeedItem, TargetInfo } from '../model/gotcha';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';

@Component({
  selector: 'app-gotcha-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-page.html',
  styleUrl: './gotcha-page.css',
})
export class GotchaPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  // ── tabs ──────────────────────────────────────
  activeTab = signal<'feed' | 'review'>('feed');

  // ── feed ──────────────────────────────────────
  items = signal<KillFeedItem[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  likingIds = signal<Set<string>>(new Set());

  private offset = 0;
  private readonly limit = 10;

  isEmpty = computed(() => !this.loading() && this.items().length === 0);

  // ── review ────────────────────────────────────
  reviewItems = signal<KillFeedItem[]>([]);
  reviewLoading = signal(false);
  reviewingIds = signal<Set<string>>(new Set());
  pendingCount = computed(() => this.reviewItems().length);

  // ── submit kill modal ─────────────────────────
  showSubmitModal = signal(false);
  photoUrl = signal('');
  submitting = signal(false);

  // ── game & player state ───────────────────────
  myStatus = this.gotchaService.myStatus;
  currentGame = this.gotchaService.currentGame;
  targetInfo = this.gotchaService.targetInfo;

  isActive = computed(() => this.currentGame()?.status === 'ACTIVE');
  isAlive = computed(() => this.myStatus()?.isAlive ?? false);
  hasTarget = computed(() => !!this.myStatus()?.targetId);
  canSubmitKill = computed(() => this.isActive() && this.isAlive() && this.hasTarget());
  isParticipant = computed(() => !!this.myStatus());

  ngOnInit() {
    this.gotchaService.getCurrentGame().subscribe();
    this.gotchaService.getMyStatus().subscribe({
      next: () => {
        // Only load target info once we know we're a participant in an active game
        if (this.isActive()) {
          this.gotchaService.getTargetInfo().subscribe();
        }
      },
      error: () => { /* not a participant, ignore */ },
    });
    this.loadFeed();
    this.loadReviewFeed();
  }

  goBack() {
    this.router.navigate(['/event']);
  }

  // ── feed ──────────────────────────────────────
  loadFeed() {
    this.loading.set(true);
    this.offset = 0;
    this.gotchaService.getFeed(this.limit, 0).subscribe({
      next: (items) => {
        this.items.set(items);
        this.hasMore.set(items.length === this.limit);
        this.offset = items.length;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('gotcha.feed.loadError');
      },
    });
  }

  loadMore() {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    this.gotchaService.getFeed(this.limit, this.offset).subscribe({
      next: (newItems) => {
        this.items.update((prev) => [...prev, ...newItems]);
        this.hasMore.set(newItems.length === this.limit);
        this.offset += newItems.length;
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
        this.toastService.error('gotcha.feed.loadError');
      },
    });
  }

  toggleLike(item: KillFeedItem) {
    if (this.likingIds().has(item.id)) return;
    this.likingIds.update((s) => new Set([...s, item.id]));
    const wasLiked = item.likedByMe;

    this.items.update((list) =>
      list.map((i) =>
        i.id === item.id
          ? { ...i, likedByMe: !wasLiked, likeCount: wasLiked ? i.likeCount - 1 : i.likeCount + 1 }
          : i
      )
    );

    const req$ = wasLiked
      ? this.gotchaService.unlikeKill(item.id)
      : this.gotchaService.likeKill(item.id);

    req$.subscribe({
      next: () => {
        this.likingIds.update((s) => { const n = new Set(s); n.delete(item.id); return n; });
      },
      error: () => {
        this.items.update((list) =>
          list.map((i) =>
            i.id === item.id
              ? { ...i, likedByMe: wasLiked, likeCount: wasLiked ? i.likeCount + 1 : i.likeCount - 1 }
              : i
          )
        );
        this.likingIds.update((s) => { const n = new Set(s); n.delete(item.id); return n; });
        this.toastService.error('gotcha.feed.likeError');
      },
    });
  }

  isLiking(id: string): boolean { return this.likingIds().has(id); }

  // ── review ────────────────────────────────────
  loadReviewFeed() {
    this.reviewLoading.set(true);
    this.gotchaService.getPendingKills().subscribe({
      next: (items) => {
        this.reviewItems.set(items);
        this.reviewLoading.set(false);
      },
      error: () => {
        this.reviewLoading.set(false);
        this.toastService.error('gotcha.review.loadError');
      },
    });
  }

  reviewKill(item: KillFeedItem, approve: boolean) {
    if (this.reviewingIds().has(item.id)) return;
    this.reviewingIds.update((s) => new Set([...s, item.id]));

    this.gotchaService.reviewKill(item.id, approve).subscribe({
      next: () => {
        this.reviewItems.update((list) => list.filter((i) => i.id !== item.id));
        this.reviewingIds.update((s) => { const n = new Set(s); n.delete(item.id); return n; });

        const newStatus = approve ? 'APPROVED' as const : 'DENIED' as const;
        this.items.update((list) =>
          list.map((i) => i.id === item.id ? { ...i, status: newStatus } : i)
        );

        this.toastService.success(approve ? 'gotcha.review.approved' : 'gotcha.review.denied');
      },
      error: () => {
        this.reviewingIds.update((s) => { const n = new Set(s); n.delete(item.id); return n; });
        this.toastService.error('gotcha.review.error');
      },
    });
  }

  isReviewing(id: string): boolean { return this.reviewingIds().has(id); }

  // ── submit kill modal ─────────────────────────
  openSubmitModal() {
    this.photoUrl.set('');
    this.showSubmitModal.set(true);
  }

  closeSubmitModal() {
    this.showSubmitModal.set(false);
  }

  submitKill() {
    if (!this.photoUrl().trim()) {
      this.toastService.error('gotcha.submitKill.noPhoto');
      return;
    }
    this.submitting.set(true);
    this.gotchaService.submitKill(this.photoUrl().trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeSubmitModal();
        this.toastService.success('gotcha.submitKill.success');
        this.loadFeed();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.error ?? 'gotcha.submitKill.error';
        this.toastService.error(msg);
      },
    });
  }

  // ── helpers ───────────────────────────────────
  formatTime(dateStr: string): string {
    const locale = this.t.currentLanguage() === 'nl' ? 'nl-BE' : 'en-GB';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return this.t.t('gotcha.feed.justNow');
    if (diffMin < 60) return `${diffMin}${this.t.t('gotcha.feed.minutesAgo')}`;
    if (diffHour < 24) return `${diffHour}${this.t.t('gotcha.feed.hoursAgo')}`;
    if (diffDay < 7) return `${diffDay}${this.t.t('gotcha.feed.daysAgo')}`;
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  }

  fullName(profile: { firstName: string; lastName: string }): string {
    return `${profile.firstName} ${profile.lastName}`.trim();
  }

  initials(profile: { firstName: string; lastName: string }): string {
    return `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();
  }

  statusClass(status: string): string {
    return ({ PENDING: 'status-pending', APPROVED: 'status-approved', DENIED: 'status-denied' }[status] ?? '');
  }

  targetInitials(info: TargetInfo): string {
    if (!info.target) return '?';
    return `${info.target.firstName?.[0] ?? ''}${info.target.lastName?.[0] ?? ''}`.toUpperCase();
  }

  targetFullName(info: TargetInfo): string {
    if (!info.target) return '';
    return `${info.target.firstName} ${info.target.lastName}`.trim();
  }
}
