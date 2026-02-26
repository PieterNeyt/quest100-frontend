import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../services/eventService';
import { TranslationService } from '../services/translationService';
import { StudentEvent } from '../model/studentEvent';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetailComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  event = signal<StudentEvent | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  joining = signal(false);
  cancelling = signal(false);
  isGoing = signal(false);

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (!eventId) {
      this.router.navigate(['/event']);
      return;
    }
    this.loadEvent(eventId);
  }

  loadEvent(eventId: string) {
    this.loading.set(true);
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.t.t('event.detail.notFound'));
        this.loading.set(false);
      }
    });
  }

  join() {
    const ev = this.event();
    if (!ev) return;
    this.joining.set(true);
    this.eventService.joinEvent(ev.id).subscribe({
      next: () => {
        this.event.update(e => !e ? e : {
          ...e,
          attendees: [...e.attendees, {
            id: crypto.randomUUID(),
            eventId: e.id,
            profileId: 'me',
            joinedAt: new Date().toISOString(),
          }]
        });
        this.isGoing.set(true);
        this.joining.set(false);
      },
      error: () => {
        this.joining.set(false);
      }
    });
  }

  cancel() {
    const ev = this.event();
    if (!ev) return;
    this.cancelling.set(true);
    this.eventService.cancelEvent(ev.id).subscribe({
      next: () => {
        this.event.update(e => !e ? e : {
          ...e,
          attendees: e.attendees.filter(a => a.profileId !== 'me')
        });
        this.isGoing.set(false);
        this.cancelling.set(false);
      },
      error: () => {
        this.cancelling.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/event']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get isFull(): boolean {
    const ev = this.event();
    if (!ev || !ev.maxAttendees) return false;
    return ev.attendees.length >= ev.maxAttendees;
  }

  categoryLabel(cat: string): string {
    return this.t.t(`event.categories.${cat}`);
  }

  categoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      SPORTS: '⚽', GAMING: '🎮', STUDY: '📚', FOOD: '🍕',
      MUSIC: '🎵', OUTDOOR: '🌿', SOCIAL: '🎉', OTHER: '✨'
    };
    return icons[cat] ?? '📌';
  }

  categoryColor(cat: string): string {
    const colors: Record<string, string> = {
      SPORTS: '#ff9600',
      GAMING: '#ce82ff',
      STUDY: '#1cb0f6',
      FOOD: '#ff4b4b',
      MUSIC: '#ff86d0',
      OUTDOOR: '#58cc02',
      SOCIAL: '#ffd900',
      OTHER: '#89e219'
    };
    return colors[cat] ?? '#afafaf';
  }
}
