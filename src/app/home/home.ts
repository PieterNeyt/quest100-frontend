import {Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {NgIcon, provideIcons} from "@ng-icons/core";
import {CommonModule} from '@angular/common';
import {ProfileService} from '../services/profileService';
import {
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideChevronRight,
  lucideClock,
  lucideInfo,
  lucideUser,
  lucideUsers,
  lucideZap
} from '@ng-icons/lucide';
import {TranslationService} from '../services/translationService';
import {ToastService} from '../services/toastService';
import {Router} from '@angular/router';
import {ArchetypeId} from '../model/profile';
import {AgendaItem} from '../model/agenda';
import {UnixTimePipe,CountdownPipe} from '../utils/unixPipe';

const TIMELINE_START = 7;
const TIMELINE_END   = 21;
const HOUR_PX        = 60;

type GameKey = 'nerdle' | 'minesweeper' | 'sudoku';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIcon, CommonModule, UnixTimePipe, CountdownPipe],
  providers: [provideIcons({
    lucideZap, lucideUsers, lucideInfo, lucideChevronDown, lucideChevronRight,
    lucideCalendar, lucideClock, lucideUser, lucideCheck
  })],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  translationService = inject(TranslationService);
  profile = this.profileService.profile;
  ts = inject(ToastService);

  readonly archetypeNames = computed<Record<ArchetypeId, string>>(() => ({
    [ArchetypeId.Wizard]:           this.translationService.t('home.archetypes.wizard'),
    [ArchetypeId.TeamCatalyst]:     this.translationService.t('home.archetypes.teamCatalyst'),
    [ArchetypeId.AtmosphereMaker]:  this.translationService.t('home.archetypes.atmosphereMaker'),
    [ArchetypeId.CampusExplorer]:   this.translationService.t('home.archetypes.campusExplorer'),
    [ArchetypeId.AcademicGuardian]: this.translationService.t('home.archetypes.academicGuardian'),
  }));

  archetypeName = computed(() => {
    const id = this.profile()?.archetypeId;
    if (id === undefined) return '';
    return this.archetypeNames()[id as ArchetypeId] ?? 'Unknown';
  });

  actionButtons = [
    {
      label: 'CANVAS',
      key: 'canvas',
      url: 'https://canvas.kdg.be/',
      logoUrl: 'https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1706635559/oxnardsdorg/a3jmgjuc95vnrlbehc4j/canvas-logo-1024x1020.png'
    },
    {
      label: 'E-STUDENT SERVICE',
      key: 'estudentservice',
      url: 'https://e-studentservice.kdg.be/Main.aspx',
      logoUrl: 'https://a.storyblok.com/f/226028/2000x2500/021b91e4b7/placeholder-kdg-mobile.webp'
    },
    {
      label: 'TIME EDIT',
      key: 'timeedit',
      url: 'https://cloud.timeedit.net',
      logoUrl: 'https://cdn.prod.website-files.com/64e6e4222dd4319151d1537d/652641e10a74cd0d04dd1da5_TE%20Logo%20Symbol.png'
    },
  ];

  tick = signal(0);
  private tickInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tickInterval = setInterval(() => this.tick.update(v => v + 1), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  navigateToGame(key: GameKey): void {
    this.router.navigate(['/minigames/' + key]);
  }

  agendaItems    = signal<AgendaItem[]>([]);
  agendaLoading  = signal<boolean>(false);
  activeAccordion = signal<string | null>('profile');

  readonly timelineHours: number[] = Array.from(
    {length: TIMELINE_END - TIMELINE_START},
    (_, i) => TIMELINE_START + i
  );
  readonly timelineHeight = (TIMELINE_END - TIMELINE_START) * HOUR_PX;

  constructor() {
    effect(() => {
      if (this.profile()) {
        this.agendaLoading.set(true);
        this.profileService.getTodayAgenda().subscribe({
          next: (items) => {
            this.agendaItems.set([...items].sort((a, b) => a.begin - b.begin));
            this.agendaLoading.set(false);
          },
          error: (err) => {
            this.ts.error('Failed to load agenda: ' + err.message);
            this.agendaLoading.set(false);
          }
        });
      }
    });
  }

  toggleAccordion(section: string) {
    if (window.innerWidth > 768) return;
    this.activeAccordion.set(this.activeAccordion() === section ? null : section);
  }

  navigateToAbout(appKey: string) {
    this.router.navigate(['/about']).then(() => {
      setTimeout(() => {
        document.getElementById('section-' + appKey)?.scrollIntoView({behavior: 'smooth', block: 'start'});
      }, 100);
    });
  }

  private tsToPixels(unix: number): number {
    const d = new Date(unix * 1000);
    return ((d.getHours() - TIMELINE_START) * 60 + d.getMinutes()) / 60 * HOUR_PX;
  }

  getEventTop(beginUnix: number): number    { return Math.max(0, this.tsToPixels(beginUnix)); }
  getEventHeight(b: number, e: number): number { return Math.max(this.tsToPixels(e) - this.tsToPixels(b), 28); }

  nowLineVisible(): boolean {
    const h = new Date().getHours();
    return h >= TIMELINE_START && h < TIMELINE_END;
  }

  nowLineTop(): number {
    const now = new Date();
    return ((now.getHours() - TIMELINE_START) * 60 + now.getMinutes()) / 60 * HOUR_PX;
  }

  readonly todayLabel = computed(() => {
    const lang = this.translationService.currentLanguage();
    const locale = lang === 'nl' ? 'nl-BE' : 'en-GB';
    return new Date().toLocaleDateString(locale, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
  });
}
