import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { LeaderboardService } from '../services/leaderboardService';
import { TranslationService } from '../services/translationService';
import {Leaderboard} from '../model/leaderboard';
import {Class, Course} from '../model/class';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIconComponent,
    HlmIconImports,
  ],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class LeaderboardComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly fb = inject(FormBuilder);
  readonly t = inject(TranslationService);

  leaderboards = signal<Leaderboard[]>([]);
  courses = signal<Course[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  sortBy = signal<'startDate' | 'endDate' | 'prize'>('startDate');
  sortDir = signal<'asc' | 'desc'>('asc');

  showCreateModal = signal(false);
  creating = signal(false);

  selectedLeaderboard = signal<Leaderboard | null>(null);
  showEditModal = signal(false);
  saving = signal(false);

  availableClasses = computed<Class[]>(() => {
    const courseId = this.createForm.get('courseId')?.value;
    const course = this.courses().find(c => c.Id   === courseId);
    return course?.Classes ?? [];
  });

  createForm: FormGroup = this.fb.group({
    courseId:  ['', Validators.required],
    startDate: ['', Validators.required],
    endDate:   ['', Validators.required],
    prizeName:        [''],
    prizeDescription: [''],
    prizePhotoUrl:    [''],
  });

  editForm: FormGroup = this.fb.group({
    startDate: [''],
    endDate:   [''],
    prizeName:        [''],
    prizeDescription: [''],
    prizePhotoUrl:    [''],
  });

  filteredLeaderboards = computed(() => {
    let list = [...this.leaderboards()];
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(lb =>
        lb.prize?.name?.toLowerCase().includes(q) ||
        lb.courseId.toLowerCase().includes(q)
      );
    }

    const sort = this.sortBy();
    const dir = this.sortDir();
    list.sort((a, b) => {
      let val = 0;
      if (sort === 'startDate') val = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      else if (sort === 'endDate') val = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      else if (sort === 'prize') val = (a.prize?.name ?? '').localeCompare(b.prize?.name ?? '');
      return dir === 'asc' ? val : -val;
    });
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.leaderboardService.getAllCoursesWithClasses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        // TODO: replace with real getAllLeaderboards() call when backend endpoint exists
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load data.');
        this.loading.set(false);
      },
    });
  }

  isActive(lb: Leaderboard): boolean {
    const now = Date.now();
    return new Date(lb.startDate).getTime() <= now && new Date(lb.endDate).getTime() >= now;
  }

  daysLeft(lb: Leaderboard): number {
    const diff = new Date(lb.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  courseName(courseId: string): string {
    return this.courses().find(c => c.Id === courseId)?.Name ?? courseId;
  }

  toggleSort(field: 'startDate' | 'endDate' | 'prize') {
    if (this.sortBy() === field) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else { this.sortBy.set(field); this.sortDir.set('asc'); }
  }

  openCreateModal() { this.createForm.reset(); this.showCreateModal.set(true); }
  closeCreateModal() { this.showCreateModal.set(false); }

  submitCreate() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    const v = this.createForm.value;

    this.leaderboardService.createLeaderboard({
      courseId:  v.courseId,
      startDate: new Date(v.startDate).toISOString(),
      endDate:   new Date(v.endDate).toISOString(),
      prize: {
        name:        v.prizeName        ?? '',
        description: v.prizeDescription ?? '',
        photoUrl:    v.prizePhotoUrl    ?? '',
      },
    }).subscribe({
      next: (lb) => {
        this.leaderboards.update(list => [lb, ...list]);
        this.creating.set(false);
        this.closeCreateModal();
      },
      error: () => this.creating.set(false),
    });
  }

  openEditModal(lb: Leaderboard, $event: MouseEvent) {
    $event.stopPropagation();
    this.selectedLeaderboard.set(lb);
    this.editForm.patchValue({
      startDate:        lb.startDate ? lb.startDate.substring(0, 16) : '',
      endDate:          lb.endDate   ? lb.endDate.substring(0, 16)   : '',
      prizeName:        lb.prize?.name ?? '',
      prizeDescription: lb.prize?.description ?? '',
      prizePhotoUrl:    lb.prize?.photoUrl ?? '',
    });
    this.showEditModal.set(true);
  }

  closeEditModal() { this.showEditModal.set(false); this.selectedLeaderboard.set(null); }

  submitEdit() {
    const lb = this.selectedLeaderboard();
    if (!lb) return;
    this.saving.set(true);
    const v = this.editForm.value;
    this.leaderboardService.updateLeaderboard(lb.id, {
      startDate: v.startDate ? new Date(v.startDate).toISOString() : undefined,
      endDate:   v.endDate   ? new Date(v.endDate).toISOString()   : undefined,
      prize: {
        name:        v.prizeName ?? '',
        description: v.prizeDescription ?? '',
        photoUrl:    v.prizePhotoUrl ?? '',
      },
    }).subscribe({
      next: (updated) => {
        this.leaderboards.update(list => list.map(i => i.id === updated.id ? updated : i));
        this.saving.set(false);
        this.closeEditModal();
      },
      error: () => this.saving.set(false),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  formatDatetimeLocal(dateStr: string): string {
    return dateStr ? dateStr.substring(0, 16) : '';
  }
}
