import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ModerationService } from '../../services/moderationService';
import { ProfileService } from '../../services/profileService';
import { Report } from '../../model/report';
import { KudosEntry, Profile } from '../../model/profile';
import {TranslationService} from '../../services/translationService';

@Component({
  selector: 'app-report-award',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-award.html',
  styleUrl: './report-award.css',
})
export class ReportAward implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moderationService = inject(ModerationService);
  private readonly profileService = inject(ProfileService);
  readonly t = inject(TranslationService);

  reportId!: string;
  targetId!: string;

  kudoEntry = signal<KudosEntry | null>(null);
  sender = signal<Profile | null>(null);
  receiver = signal<Profile | null>(null);
  report = signal<Report | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showResolveModal = signal(false);
  resolving = signal(false);

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('reportId')!;
    this.targetId = this.route.snapshot.paramMap.get('targetId')!;

    if (!this.reportId || !this.targetId) {
      this.router.navigate(['/reports/dashboard']);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load kudo entry
    this.moderationService.getKudoEntryById(this.targetId).subscribe({
      next: (entry) => {
        this.kudoEntry.set(entry);
        this.loading.set(false);

        // Load receiver profile
        this.profileService.getProfileById(entry.ProfileID).subscribe({
          next: (profile) => this.receiver.set(profile),
          error: () => {}
        });

        // Load sender profile if present
        if (entry.SenderID) {
          this.profileService.getProfileById(entry.SenderID).subscribe({
            next: (profile) => this.sender.set(profile),
            error: () => {}
          });
        }
      },
      error: () => {
        this.error.set('Failed to load kudo entry.');
        this.loading.set(false);
      },
    });

    // Load report banner — non-blocking
    this.moderationService.getReports().subscribe({
      next: (reports) => {
        const found = reports.find(r => r.id === this.reportId) ?? null;
        this.report.set(found);
      },
      error: () => {}
    });
  }

  resolve(): void {
    if (this.resolving()) return;
    this.resolving.set(true);
    this.moderationService.resolveReport(this.reportId).subscribe({
      next: () => {
        this.report.update(r => r ? { ...r, resolved: true } : r);
        this.resolving.set(false);
        this.showResolveModal.set(false);
      },
      error: () => {
        this.resolving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reports/dashboard']);
  }

  kudoTypeLabel(type: string): string {
    const map: Record<string, string> = {
      KudoKnowledge:  'Knowledge',
      KudoAttendance: 'Attendance',
      KudoTeamwork:   'Teamwork',
      KudoAtmosphere: 'Atmosphere',
      KudoEngagement: 'Engagement',
    };
    return map[type] ?? type;
  }

  kudoTypeColor(type: string): string {
    const map: Record<string, string> = {
      KudoKnowledge:  '#6366f1',
      KudoAttendance: '#f59e0b',
      KudoTeamwork:   '#10b981',
      KudoAtmosphere: '#ec4899',
      KudoEngagement: '#5aaab4',
    };
    return map[type] ?? '#6b7280';
  }

  initials(profile: Profile | null): string {
    if (!profile) return '?';
    return ((profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '')).toUpperCase() || '?';
  }
}
