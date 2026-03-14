import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ModerationService} from '../../services/moderationService';
import {StudentEvent} from '../../model/studentEvent';
import {categoryColor, categoryIconSvg} from '../../utils/Categoryutils';

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

  event = signal<StudentEvent | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly categoryColor = categoryColor;
  readonly categoryIconSvg = categoryIconSvg;

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('eventId');
    if (!reportId) { this.router.navigate(['/reports/dashboard']); return; }

    this.moderationService.getReportedEventById(reportId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch report:', err);
        this.error.set('Could not load the reported event.');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reports/dashboard']);
  }

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
