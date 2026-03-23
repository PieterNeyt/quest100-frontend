import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { forkJoin } from 'rxjs';
import { LeaderboardService } from '../services/leaderboardService';
import { TranslationService } from '../services/translationService';
import { Leaderboard } from '../model/leaderboard';
import { Class, Course } from '../model/class';
import {LeaderboardModalComponent} from '../leaderboard-modal/leaderboard-modal';
import {ToastService} from '../services/toastService';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIconComponent,
    HlmIconImports,
    LeaderboardModalComponent,
  ],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class LeaderboardComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly fb = inject(FormBuilder);
  readonly translationService = inject(TranslationService);
  ts = inject(ToastService);

  leaderboards = signal<Leaderboard[]>([]);
  courses = signal<Course[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  sortBy = signal<'startDate' | 'endDate' | 'prize'>('startDate');
  sortDir = signal<'asc' | 'desc'>('asc');

  // ── Create modal ──────────────────────────────────────────────────────────
  showCreateModal = signal(false);
  creating = signal(false);

  // ── Edit modal ────────────────────────────────────────────────────────────
  selectedLeaderboard = signal<Leaderboard | null>(null);
  showEditModal = signal(false);
  saving = signal(false);

  // ── Standings modal ───────────────────────────────────────────────────────
  showStandingsModal = signal(false);
  standingsLeaderboard = signal<Leaderboard | null>(null);
  loadingStandings = signal(false);

  availableClasses = computed<Class[]>(() => {
    const courseId = this.createForm.get('courseId')?.value;
    const course = this.courses().find((c) => c.Id === courseId);
    return course?.Classes ?? [];
  });

  createForm: FormGroup = this.fb.group({
    courseId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    prizeName: [''],
    prizeDescription: [''],
    prizePhotoUrl: [''],
  });

  editForm: FormGroup = this.fb.group({
    startDate: [''],
    endDate: [''],
    prizeName: [''],
    prizeDescription: [''],
    prizePhotoUrl: [''],
  });

  filteredLeaderboards = computed(() => {
    let list = [...this.leaderboards()];
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(
        (lb) =>
          lb.Prize?.Name?.toLowerCase().includes(q) ||
          lb.CourseId.toLowerCase().includes(q)
      );
    }

    const sort = this.sortBy();
    const dir = this.sortDir();
    list.sort((a, b) => {
      let val = 0;
      if (sort === 'startDate')
        val =
          new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime();
      else if (sort === 'endDate')
        val = new Date(a.EndDate).getTime() - new Date(b.EndDate).getTime();
      else if (sort === 'prize')
        val = (a.Prize?.Name ?? '').localeCompare(b.Prize?.Name ?? '');
      return dir === 'asc' ? val : -val;
    });
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      courses: this.leaderboardService.getAllCoursesWithClasses(),
      leaderboards: this.leaderboardService.getAllLeaderboards(),
    }).subscribe({
      next: ({ courses, leaderboards }) => {
        this.courses.set(courses);
        this.leaderboards.set(leaderboards);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translationService.t('leaderboard.error'));
        this.loading.set(false);
      },
    });
  }

  openStandingsModal(lb: Leaderboard) {
    this.standingsLeaderboard.set(lb);
    console.log(this.standingsLeaderboard());
    this.showStandingsModal.set(true);
  }

  closeStandingsModal() {
    this.showStandingsModal.set(false);
    this.standingsLeaderboard.set(null);
  }

  sortedClasses() {
    return [...(this.standingsLeaderboard()?.Classes ?? [])].sort(
      (a, b) => b.TotalKudos - a.TotalKudos
    );
  }

  isActive(lb: Leaderboard): boolean {
    const now = Date.now();
    return (
      new Date(lb.StartDate).getTime() <= now &&
      new Date(lb.EndDate).getTime() >= now
    );
  }

  daysLeft(lb: Leaderboard): number {
    const diff = new Date(lb.EndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  courseName(courseId: string): string {
    return this.courses().find((c) => c.Id === courseId)?.Name ?? courseId;
  }

  toggleSort(field: 'startDate' | 'endDate' | 'prize') {
    if (this.sortBy() === field)
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
  }

  private toMidnightISO(dateStr: string): string {
    return dateStr ? `${dateStr}T00:00:00` : dateStr;
  }

  openCreateModal() {
    this.createForm.reset();
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitCreate() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    const v = this.createForm.value;

    this.leaderboardService
      .createLeaderboard({
        courseId: v.courseId,
        startDate: new Date(this.toMidnightISO(v.startDate)).toISOString(),
        endDate: new Date(this.toMidnightISO(v.endDate)).toISOString(),
        prize: {
          name: v.prizeName ?? '',
          description: v.prizeDescription ?? '',
          photoUrl: v.prizePhotoUrl ?? '',
        },
      })
      .subscribe({
        next: (lb) => {
          this.leaderboards.update((list) => [lb, ...list]);
          this.creating.set(false);
          this.closeCreateModal();
        },
        error: () => {
          this.creating.set(false);
          this.ts.error(this.translationService.t('leaderboard.createError'));
        },
      });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  openEditModal(lb: Leaderboard, $event: MouseEvent) {
    $event.stopPropagation();
    this.selectedLeaderboard.set(lb);
    this.editForm.patchValue({
      startDate: lb.StartDate ? lb.StartDate.substring(0, 10) : '',
      endDate: lb.EndDate ? lb.EndDate.substring(0, 10) : '',
      prizeName: lb.Prize?.Name ?? '',
      prizeDescription: lb.Prize?.Description ?? '',
      prizePhotoUrl: lb.Prize?.PhotoURL ?? '',
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedLeaderboard.set(null);
  }

  submitEdit() {
    const lb = this.selectedLeaderboard();
    if (!lb) return;
    this.saving.set(true);
    const v = this.editForm.value;

    this.leaderboardService
      .updateLeaderboard(lb.ID, {
        startDate: v.startDate
          ? new Date(this.toMidnightISO(v.startDate)).toISOString()
          : undefined,
        endDate: v.endDate
          ? new Date(this.toMidnightISO(v.endDate)).toISOString()
          : undefined,
        prize: {
          name: v.prizeName ?? '',
          description: v.prizeDescription ?? '',
          photoUrl: v.prizePhotoUrl ?? '',
        },
      })
      .subscribe({
        next: (updated) => {
          this.leaderboards.update((list) =>
            list.map((i) => (i.ID === updated.ID ? updated : i))
          );
          this.saving.set(false);
          this.closeEditModal();
        },
        error: () => {
          this.saving.set(false);
          this.ts.error(this.translationService.t('leaderboard.editError'));
        },
      });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
