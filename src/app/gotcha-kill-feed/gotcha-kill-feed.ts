import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService, KillFeedItem } from '../services/gotchaService';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';

@Component({
  selector: 'app-gotcha-kill-feed',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-kill-feed.html',
  styleUrl: './gotcha-kill-feed.css',
})
export class GotchaKillFeedComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService = inject(ToastService);
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

  // ── review — FIFO stack ───────────────────────
  currentReviewItem = signal<KillFeedItem | null>(null);
  pendingCount = signal(0);
  reviewLoading = signal(false);
  isReviewingKill = signal(false);
  reviewDone = computed(() => !this.reviewLoading() && this.currentReviewItem() === null);

  ngOnInit() {
    this.loadFeed();
    this.loadNextReviewItem();
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
      error: () => { this.loading.set(false); this.toastService.error('gotcha.feed.loadError'); },
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
      error: () => { this.loadingMore.set(false); this.toastService.error('gotcha.feed.loadError'); },
    });
  }

  toggleLike(item: KillFeedItem) {
    if (this.likingIds().has(item.id)) return;
    this.likingIds.update((s) => new Set([...s, item.id]));
    const wasLiked = item.likedByMe;
    this.items.update((list) =>
      list.map((i) => i.id === item.id
        ? { ...i, likedByMe: !wasLiked, likeCount: wasLiked ? i.likeCount - 1 : i.likeCount + 1 }
        : i)
    );
    const req$ = wasLiked ? this.gotchaService.unlikeKill(item.id) : this.gotchaService.likeKill(item.id);
    req$.subscribe({
      next: () => { this.likingIds.update((s) => { const n = new Set(s); n.delete(item.id); return n; }); },
      error: () => {
        this.items.update((list) =>
          list.map((i) => i.id === item.id
            ? { ...i, likedByMe: wasLiked, likeCount: wasLiked ? i.likeCount + 1 : i.likeCount - 1 }
            : i)
        );
        this.likingIds.update((s) => { const n = new Set(s); n.delete(item.id); return n; });
        this.toastService.error('gotcha.feed.likeError');
      },
    });
  }

  isLiking(id: string): boolean { return this.likingIds().has(id); }

  // ── FIFO review ───────────────────────────────
  loadNextReviewItem() {
    this.reviewLoading.set(true);
    this.currentReviewItem.set(null);

    this.gotchaService.getPendingKillCount().subscribe({
      next: ({ count }) => this.pendingCount.set(count),
    });

    this.gotchaService.getNextPendingKill().subscribe({
      next: (item) => { this.currentReviewItem.set(item); this.reviewLoading.set(false); },
      error: () => { this.currentReviewItem.set(null); this.reviewLoading.set(false); },
    });
  }

  reviewKill(approve: boolean) {
    const item = this.currentReviewItem();
    if (!item || this.isReviewingKill()) return;
    this.isReviewingKill.set(true);

    this.gotchaService.reviewKill(item.id, approve).subscribe({
      next: () => {
        this.isReviewingKill.set(false);
        this.pendingCount.update((n) => Math.max(0, n - 1));
        this.toastService.success(approve ? 'gotcha.review.approved' : 'gotcha.review.denied');
        const newStatus = approve ? 'APPROVED' : 'DENIED';
        this.items.update((list) =>
          list.map((i) => i.id === item.id ? { ...i, status: newStatus } : i)
        );
        this.loadNextReviewItem();
      },
      error: () => { this.isReviewingKill.set(false); this.toastService.error('gotcha.review.error'); },
    });
  }

  get stackDepth(): number { return Math.min(this.pendingCount() - 1, 2); }

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

  fullName(p: { firstName: string; lastName: string }): string {
    return `${p.firstName} ${p.lastName}`.trim();
  }

  initials(p: { firstName: string; lastName: string }): string {
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
  }

  statusClass(status: string): string {
    return ({ PENDING: 'status-pending', APPROVED: 'status-approved', DENIED: 'status-denied' }[status] ?? '');
  }
}
