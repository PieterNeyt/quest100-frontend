import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LeaderboardService} from '../services/leaderboardService';
import {ProfileService} from '../services/profileService';
import {Class, Course} from '../model/class';


@Component({
  selector: 'app-no-class-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './no-class-modal.html',
  styleUrls: ['./no-class-modal.css'],
})
export class NoClassModalComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly profileService = inject(ProfileService);

  courses = this.leaderboardService.courses;

  selectedCourse = signal<Course | null>(null);
  selectedClass = signal<Class | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Classes that belong to the selected course
  availableClasses = computed(() => this.selectedCourse()?.Classes ?? []);

  ngOnInit(): void {
    // Load courses + their classes on mount
    this.leaderboardService.getAllCoursesWithClasses().subscribe({
      error: () => this.error.set('Kon richtingen niet laden. Probeer opnieuw.'),
    });
  }

  onCourseChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const course = this.courses().find((c) => c.Id === id) ?? null;
    this.selectedCourse.set(course);
    this.selectedClass.set(null); // reset class when course changes
    this.error.set(null);
  }

  onClassChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const cls = this.availableClasses().find((c) => c.Id === id) ?? null;
    this.selectedClass.set(cls);
    this.error.set(null);
  }

  submit(): void {
    const cls = this.selectedClass();
    if (!cls) return;

    this.loading.set(true);
    this.error.set(null);

    this.profileService.updateClass(cls.Id).subscribe({
      next: () => {
        this.profileService.showNoClassModal.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Opslaan mislukt. Probeer het opnieuw.');
        this.loading.set(false);
      },
    });
  }
}
