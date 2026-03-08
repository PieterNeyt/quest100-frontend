import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../services/eventService';
import {ProfileService} from '../services/profileService';
import {TranslationService} from '../services/translationService';
import {EventAttendee, StudentEvent} from '../model/studentEvent';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {categoryColor, categoryIconSvg} from '../utils/Categoryutils';
import {EventFormComponent} from '../components/event-form/event-form';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIcon} from '@spartan-ng/helm/icon';
import {Chat} from '../components/chat/chat';
import {ReportComponent} from '../report/report';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EventFormComponent, NgIconComponent, HlmIcon, Chat, ReportComponent],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetailComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly t = inject(TranslationService);

  event = signal<StudentEvent | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  joining = signal(false);
  cancelling = signal(false);

  showEditModal = signal(false);
  saving = signal(false);
  deleting = signal(false);

  showOrganizerCancelModal = signal(false);
  transferToProfileId = signal<string>('');

  // Report modal
  showReportModal = signal(false);

  readonly categoryColor = categoryColor;
  readonly categoryIconSvg = categoryIconSvg;

  editForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    photo: [null],
    category: ['', Validators.required],
    eventDate: ['', Validators.required],
    maxAttendees: [null, [Validators.min(1), Validators.pattern('^[0-9]+$')]],
  });

  get currentProfile() { return this.profileService.profile(); }
  get currentProfileId(): string { return this.currentProfile?.id ?? ''; }

  isGoing = computed(() => {
    const ev = this.event();
    if (!ev || !this.currentProfileId) return false;
    return ev.attendees.some(a => a.profileId === this.currentProfileId);
  });

  isOrganizer = computed(() => {
    const ev = this.event();
    if (!ev || !this.currentProfileId) return false;
    return ev.organizerId === this.currentProfileId;
  });

  otherAttendees = computed(() => {
    const ev = this.event();
    if (!ev) return [];
    return ev.attendees.filter(a => a.profileId !== this.currentProfileId);
  });

  categoryLabel(cat: string): string { return this.t.t(`event.categories.${cat}`); }

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (!eventId) { this.router.navigate(['/event']); return; }
    this.loadEvent(eventId);
  }

  loadEvent(eventId: string) {
    this.loading.set(true);
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => { this.event.set(event); this.loading.set(false); },
      error: () => { this.error.set(this.t.t('event.detail.notFound')); this.loading.set(false); }
    });
  }

  join() {
    const ev = this.event();
    if (!ev || !this.currentProfile) return;
    this.joining.set(true);

    const p = this.currentProfile;
    const optimisticAttendee: EventAttendee = {
      eventId: ev.id,
      profileId: this.currentProfileId,
      joinedAt: new Date().toISOString(),
      firstName: p.firstName,
      lastName: p.lastName,
      customProfilePicture: p.customProfilePicture ?? this.profileService.microsoftProfilePicture() ?? null,
    };

    this.eventService.joinEvent(ev.id).subscribe({
      next: () => {
        this.event.update(e => !e ? e : {
          ...e,
          attendees: [...e.attendees, optimisticAttendee]
        });
        this.joining.set(false);
      },
      error: () => this.joining.set(false)
    });
  }

  cancel() {
    if (this.isOrganizer()) { this.showOrganizerCancelModal.set(true); return; }
    this.doCancel();
  }

  doCancel() {
    const ev = this.event();
    if (!ev) return;
    this.cancelling.set(true);
    this.eventService.cancelEvent(ev.id).subscribe({
      next: () => {
        this.event.update(e => !e ? e : {
          ...e, attendees: e.attendees.filter(a => a.profileId !== this.currentProfileId)
        });
        this.cancelling.set(false);
      },
      error: () => this.cancelling.set(false)
    });
  }

  transferAndLeave() {
    const ev = this.event();
    const newOrganizerId = this.transferToProfileId();
    if (!ev || !newOrganizerId) return;
    this.cancelling.set(true);
    this.eventService.updateEvent(ev.id, { ...ev, organizerId: newOrganizerId }).subscribe({
      next: (updated) => {
        this.event.set(updated);
        this.showOrganizerCancelModal.set(false);
        this.doCancel();
      },
      error: () => this.cancelling.set(false)
    });
  }

  deleteEventAsOrganizer() {
    const ev = this.event();
    if (!ev) return;
    this.deleting.set(true);
    this.eventService.deleteEvent(ev.id).subscribe({
      next: () => this.router.navigate(['/event']),
      error: () => this.deleting.set(false)
    });
  }

  openEditModal() {
    const ev = this.event();
    if (!ev) return;
    const localDate = new Date(ev.eventDate);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${localDate.getFullYear()}-${pad(localDate.getMonth()+1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
    this.editForm.patchValue({ title: ev.title, description: ev.description, photo: ev.photo ?? null, category: ev.category, eventDate: dateStr, maxAttendees: ev.maxAttendees ?? null });
    this.showEditModal.set(true);
  }

  closeEditModal() { this.showEditModal.set(false); }

  submitEdit() {
    if (this.editForm.invalid) return;
    const ev = this.event();
    if (!ev) return;
    this.saving.set(true);
    const val = this.editForm.value;
    const payload: any = {
      title: val.title, description: val.description || '',
      photo: val.photo || null, category: val.category,
      eventDate: new Date(val.eventDate).toISOString(),
      maxAttendees: val.maxAttendees ? parseInt(val.maxAttendees) : null,
    };
    this.eventService.updateEvent(ev.id, payload).subscribe({
      next: (updated) => { this.event.set(updated); this.saving.set(false); this.closeEditModal(); },
      error: () => this.saving.set(false)
    });
  }

  openReportModal() { this.showReportModal.set(true); }
  closeReportModal() { this.showReportModal.set(false); }

  getAttendeeDisplayName(attendee: EventAttendee): string {
    if (attendee.firstName && attendee.lastName) {
      return `${attendee.firstName} ${attendee.lastName}`;
    }
    return attendee.profileId.slice(0, 8);
  }

  getAttendeeAvatar(attendee: EventAttendee): string {
    if (attendee.customProfilePicture) return attendee.customProfilePicture;
    if (attendee.profileId === this.currentProfileId) {
      return this.profileService.activeProfilePicture;
    }
    return '';
  }

  getAttendeeInitials(attendee: EventAttendee): string {
    const first = attendee.firstName ?? '';
    const last = attendee.lastName ?? '';
    if (first && last) return (first[0] + last[0]).toUpperCase();
    return attendee.profileId.slice(0, 2).toUpperCase();
  }

  goBack() { this.router.navigate(['/event']); }

  formatDate(dateStr: string): string {
    const locale = this.t.currentLanguage() === 'nl' ? 'nl-BE' : 'en-GB';
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get isFull(): boolean {
    const ev = this.event();
    if (!ev || !ev.maxAttendees) return false;
    return ev.attendees.length >= ev.maxAttendees;
  }
}
