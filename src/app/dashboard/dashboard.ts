import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModerationService } from '../services/moderationService';
import { ChannelType, Report, ReportType } from '../model/report';
import type { Report as ModerationReport } from '../model/report';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly moderationService = inject(ModerationService);
  private readonly router = inject(Router);

  reports = signal<ModerationReport[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  filterReportType = signal<ReportType | 'all'>('all');
  filterChannelType = signal<ChannelType | 'all'>('all');

  readonly reportTypeOptions: { label: string; value: ReportType | 'all' }[] = [
    { label: 'All types', value: 'all' },
    { label: 'Harassment', value: ReportType.Harassment },
    { label: 'Racism', value: ReportType.Racism },
    { label: 'Spam', value: ReportType.Spam },
    { label: 'Hate Speech', value: ReportType.HateSpeech },
    { label: 'Other', value: ReportType.Other },
  ];

  readonly channelTypeOptions: { label: string; value: ChannelType | 'all' }[] = [
    { label: 'All channels', value: 'all' },
    { label: 'Event', value: ChannelType.Event },
    { label: 'Message', value: ChannelType.Message },
    { label: 'Award', value: ChannelType.Award },
  ];

  private filteredBase = computed(() => {
    let list = this.reports();
    if (this.filterReportType() !== 'all') list = list.filter(r => r.reportType === this.filterReportType());
    if (this.filterChannelType() !== 'all') list = list.filter(r => r.channelType === this.filterChannelType());
    return list;
  });

  openFilteredReports = computed(() => this.filteredBase().filter(r => !r.resolved));
  closedFilteredReports = computed(() => this.filteredBase().filter(r => r.resolved));

  ngOnInit() {
    this.loadReports();
  }

  resolveAndNavigate(report: Report, event: MouseEvent): void {
    event.stopPropagation();
    const type = Number(report.channelType);

    if (type === 0) {
      this.router.navigate(['/report', report.id, 'event', report.targetId]);
    } else if (type === 1) {
      this.router.navigate(['/report', report.id, 'message', report.targetId, 'chat', report.contextId]);
    } else if (type === 2) {
      this.router.navigate(['/report', report.id, 'award', report.targetId]);
    }
  }

  loadReports() {
    this.loading.set(true);
    this.error.set(null);
    this.moderationService.getReports().subscribe({
      next: (data) => { this.reports.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load reports.'); this.loading.set(false); },
    });
  }

  reportTypeLabel(type: ReportType): string {
    return ['Harassment', 'Racism', 'Spam', 'Hate Speech', 'Other'][type] ?? 'Unknown';
  }

  channelTypeLabel(type: ChannelType): string {
    return ['Event', 'Message', 'Award'][type] ?? 'Unknown';
  }

  reportTypeBadgeColor(type: ReportType): string {
    return ['#ef4444', '#b91c1c', '#f59e0b', '#7c3aed', '#6b7280'][type] ?? '#6b7280';
  }
}
