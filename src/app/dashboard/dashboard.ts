import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModerationService } from '../services/moderationService';
import {ChannelType, Report, ReportType} from '../model/report';
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

  filterStatus = signal<'all' | 'open' | 'resolved'>('all');
  filterReportType = signal<ReportType | 'all'>('all');
  filterChannelType = signal<ChannelType | 'all'>('all');
  searchQuery = signal('');

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

  filteredReports = computed(() => {
    let list = this.reports();
    const q = this.searchQuery().toLowerCase();
    if (q) list = list.filter(r => r.message.toLowerCase().includes(q) || r.targetId.toLowerCase().includes(q));
    if (this.filterStatus() === 'open') list = list.filter(r => !r.resolved);
    if (this.filterStatus() === 'resolved') list = list.filter(r => r.resolved);
    if (this.filterReportType() !== 'all') list = list.filter(r => r.reportType === this.filterReportType());
    if (this.filterChannelType() !== 'all') list = list.filter(r => r.channelType === this.filterChannelType());
    return list;
  });

  openCount = computed(() => this.reports().filter(r => !r.resolved).length);
  resolvedCount = computed(() => this.reports().filter(r => r.resolved).length);

  ngOnInit() {
    this.loadReports();
  }

  resolveAndNavigate(report: Report, event: MouseEvent): void {
    event.stopPropagation();

    if (report.reportType === 0) {
      this.router.navigate(['/report', report.id, 'event',report.targetId]);
    } else if (report.reportType === 1) {
      this.router.navigate(['/report', report.id, 'message',report.contextId]);
    } else if (report.reportType === 2) {
      this.router.navigate(['/report', report.id, 'award']);
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

  goToDetail(reportId: string, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/moderation/reports', reportId]);
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
