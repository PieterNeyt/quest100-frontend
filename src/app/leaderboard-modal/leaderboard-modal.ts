import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { Leaderboard } from '../model/leaderboard';
import { Course } from '../model/class';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-leaderboard-modal',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './leaderboard-modal.html',
  styleUrl: './leaderboard-modal.css',
})
export class LeaderboardModalComponent {
  leaderboard = input.required<Leaderboard>();
  courses = input<Course[]>([]);
  closed = output<void>();
  readonly translationService = inject(TranslationService);

  sortedClasses = computed(() =>
    [...(this.leaderboard()?.Classes ?? [])].sort(
      (a, b) => b.TotalKudos - a.TotalKudos
    )
  );

  getKudosPercent(kudos: number): number {
    const top = this.sortedClasses()[0]?.TotalKudos ?? 0;
    return top > 0 ? (kudos / top) * 100 : 0;
  }

  classNameById(classId: string): string {
    for (const course of this.courses()) {
      const found = course.Classes?.find((c) => c.Id === classId);
      if (found) return found.Name;
    }
    return classId;
  }

  courseName(courseId: string): string {
    return this.courses().find((c) => c.Id === courseId)?.Name ?? courseId;
  }

  isActive(): boolean {
    const now = Date.now();
    const lb = this.leaderboard();
    return (
      new Date(lb.StartDate).getTime() <= now &&
      new Date(lb.EndDate).getTime() >= now
    );
  }

  daysLeft(): number {
    const diff = new Date(this.leaderboard().EndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  close() {
    this.closed.emit();
  }
}
