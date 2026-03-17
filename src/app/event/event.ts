import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {EventService} from '../services/eventService';
import {TranslationService} from '../services/translationService';
import {EventCategory, StudentEvent} from '../model/studentEvent';
import {CATEGORIES, categoryColor, categoryIconSvg} from '../utils/Categoryutils';
import {EventFormComponent} from '../components/event-form/event-form';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {GotchaBannerComponent} from '../components/gotcha-banner/gotcha-banner';
import {ReportComponent} from '../components/report/report';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EventFormComponent,
    NgIconComponent,
    HlmIconImports,
    ReportComponent,
    GotchaBannerComponent,
  ],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './event.html',
  styleUrl: './event.css',
})
export class EventComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly t = inject(TranslationService);

  events = signal<StudentEvent[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  selectedCategory = signal<EventCategory | ''>('');
  sortBy = signal<'date' | 'title' | 'attendees'>('date');
  sortDir = signal<'asc' | 'desc'>('asc');

  showCreateModal = signal(false);
  creating = signal(false);

  // Report modal state
  reportingEvent = signal<StudentEvent | null>(null);

  readonly categoryColor = categoryColor;
  readonly categoryIconSvg = categoryIconSvg;
  readonly categories = CATEGORIES;

  createForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    photo: [null],
    category: ['', Validators.required],
    eventDate: ['', Validators.required],
    maxAttendees: [null, [Validators.min(1), Validators.pattern('^[0-9]+$')]],
  });

  filteredEvents = computed(() => {
    let list = [...this.events()];
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        this.categoryLabel(e.category).toLowerCase().includes(q)
      );
    }
    const cat = this.selectedCategory();
    if (cat) list = list.filter(e => e.category === cat);

    const sort = this.sortBy();
    const dir = this.sortDir();
    list.sort((a, b) => {
      let val = 0;
      if (sort === 'date') val = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      else if (sort === 'title') val = a.title.localeCompare(b.title);
      else if (sort === 'attendees') val = a.attendees.length - b.attendees.length;
      return dir === 'asc' ? val : -val;
    });
    return list;
  });

  ngOnInit() { this.loadEvents(); }

  loadEvents() {
    this.loading.set(true);
    this.eventService.getAllEvents().subscribe({
      next: (events) => { this.events.set(events); this.loading.set(false); },
      error: () => { this.error.set(this.t.t('errors.generic')); this.loading.set(false); }
    });
  }

  goToDetail(event: StudentEvent) { this.router.navigate(['/event', event.id]); }

  toggleSort(field: 'date' | 'title' | 'attendees') {
    if (this.sortBy() === field) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else { this.sortBy.set(field); this.sortDir.set('asc'); }
  }

  openCreateModal() { this.createForm.reset(); this.showCreateModal.set(true); }
  closeCreateModal() { this.showCreateModal.set(false); }

  openReportModal(event: StudentEvent, $event: MouseEvent) {
    $event.stopPropagation();
    this.reportingEvent.set(event);
  }

  closeReportModal() { this.reportingEvent.set(null); }

  submitCreate() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    const val = this.createForm.value;
    const payload: any = {
      title: val.title, description: val.description || '',
      photo: val.photo || null, category: val.category,
      eventDate: new Date(val.eventDate).toISOString(),
      maxAttendees: val.maxAttendees ? parseInt(val.maxAttendees) : null,
    };
    this.eventService.createEvent(payload).subscribe({
      next: (event) => {
        const normalized: StudentEvent = {
          ...event,
          attendees: Array.isArray(event.attendees) ? event.attendees : [],
        };
        this.events.update(list => [normalized, ...list]);
        this.creating.set(false);
        this.closeCreateModal();
      },
      error: () => this.creating.set(false)
    });
  }

  formatDate(dateStr: string): string {
    const locale = this.t.currentLanguage() === 'nl' ? 'nl-BE' : 'en-GB';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  categoryLabel(cat: EventCategory | string): string { return this.t.t(`event.categories.${cat}`); }

}
