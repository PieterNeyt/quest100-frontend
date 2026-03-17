import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ModerationService } from '../../services/moderationService';
import { ProfileService } from '../../services/profileService';
import { StudentEvent } from '../../model/studentEvent';
import { Profile } from '../../model/profile';
import { Report } from '../../model/report';
import { categoryColor, categoryIconSvg } from '../../utils/Categoryutils';

@Component({
  selector: 'app-report-event',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-event.html',
  styleUrl: './report-event.css',
})
export class reportEvent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moderationService = inject(ModerationService);
  private readonly profileService = inject(ProfileService);

  event = signal<StudentEvent | null>(null);
  report = signal<Report | null>(null);
  organizer = signal<Profile | null>(null);
  attendeeProfiles = signal<Map<string, Profile>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);
  showResolveModal = signal(false);
  resolving = signal(false);

  readonly categoryColor = categoryColor;
  readonly categoryIconSvg = categoryIconSvg;

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('reportId');
    if (!reportId) { this.router.navigate(['/reports/dashboard']); return; }

    // Load report + event in parallel
    this.moderationService.getReports().subscribe({
      next: (reports) => {
        const report = reports.find(r => r.id === reportId) ?? null;
        this.report.set(report);

        const eventId = report?.targetId ?? report?.contextId;
        if (!eventId) { this.error.set('Could not find linked event.'); this.loading.set(false); return; }

        this.moderationService.getReportedEventById(eventId).subscribe({
          next: (event) => {
            this.event.set(event);
            this.loadProfiles(event);
          },
          error: () => {
            this.error.set('Could not load the reported event.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Could not load report.');
        this.loading.set(false);
      },
    });
  }

  private loadProfiles(event: StudentEvent): void {
    const profileIds = [...new Set([
      event.organizerId,
      ...event.attendees.map(a => a.profileId),
    ])];

    forkJoin(profileIds.map(id => this.profileService.getProfileById(id))).subscribe({
      next: (profiles) => {
        const map = new Map<string, Profile>();
        profiles.forEach(p => map.set(p.id, p));
        this.attendeeProfiles.set(map);
        this.organizer.set(map.get(event.organizerId) ?? null);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  resolve(): void {
    const report = this.report();
    if (!report) return;
    this.resolving.set(true);
    this.moderationService.resolveReport(report.id).subscribe({
      next: () => {
        this.resolving.set(false);
        this.showResolveModal.set(false);
        this.router.navigate(['/reports/dashboard']);
      },
      error: () => { this.resolving.set(false); },
    });
  }

  getProfileName(profileId: string): string {
    const p = this.attendeeProfiles().get(profileId);
    if (!p) return profileId.slice(0, 8);
    return `${p.firstName} ${p.lastName}`.trim() || profileId.slice(0, 8);
  }

  getProfileAvatar(profileId: string): string {
    return this.attendeeProfiles().get(profileId)?.customProfilePicture ?? '';
  }

  getProfileInitials(profileId: string): string {
    const p = this.attendeeProfiles().get(profileId);
    if (!p) return profileId.slice(0, 2).toUpperCase();
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase() || profileId.slice(0, 2).toUpperCase();
  }

  goBack(): void { this.router.navigate(['/reports/dashboard']); }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      weekday: 'long', day: '2-digit', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  categoryLabel(cat: string): string {
    return cat.charAt(0) + cat.slice(1).toLowerCase();
  }


}
