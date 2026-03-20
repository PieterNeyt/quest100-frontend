import {Component, computed, effect, inject, signal} from '@angular/core';
import {NgIcon, provideIcons} from "@ng-icons/core";
import {CommonModule} from '@angular/common';
import {ProfileService} from '../services/profileService';
import {
  lucideCalendar,
  lucideChevronDown,
  lucideClock,
  lucideInfo,
  lucideMapPin,
  lucideQrCode,
  lucideStar,
  lucideTarget,
  lucideUser,
  lucideUsers,
  lucideZap
} from '@ng-icons/lucide';
import {TranslationService} from '../services/translationService';
import {ToastService} from '../services/toastService';
import {Router} from '@angular/router';
import {ArchetypeId} from '../model/profile';
import {AgendaItem} from '../model/agenda';
import {UnixTimePipe} from '../utils/unixPipe';

const TIMELINE_START = 7;
const TIMELINE_END   = 21;
const HOUR_PX        = 60;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIcon, CommonModule, UnixTimePipe],
  providers: [provideIcons({
    lucideQrCode, lucideStar, lucideZap, lucideTarget,
    lucideUsers, lucideInfo, lucideChevronDown,
    lucideCalendar, lucideClock, lucideMapPin, lucideUser
  })],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
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
      logoUrl: 'https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1706635559/oxnardsdorg/a3jmgjuc95vnrlbehc4j/canvas-logo-1024x1020.png'
    },
    {
      label: 'E-STUDENT SERVICE',
      key: 'estudentservice',
      logoUrl: 'https://a.storyblok.com/f/226028/2000x2500/021b91e4b7/placeholder-kdg-mobile.webp'
    },
    {
      label: 'TIME EDIT',
      key: 'timeedit',
      logoUrl: 'https://cdn.prod.website-files.com/64e6e4222dd4319151d1537d/652641e10a74cd0d04dd1da5_TE%20Logo%20Symbol.png'
    },
  ];

  playerStats    = signal<any | null>(null);
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
        this.profileService.getPlayerStats()
          .subscribe({
            next: (stats) => this.playerStats.set(stats),
            error: (err) => this.ts.error('Failed to load player stats: ' + err.message)
          });

        this.agendaLoading.set(true);
        this.profileService.getTodayAgenda()
          .subscribe({
            next: (items) => {
              const sorted = [...items].sort((a, b) => a.begin - b.begin);
              this.agendaItems.set(sorted);
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
        const element = document.getElementById('section-' + appKey);
        if (element) element.scrollIntoView({behavior: 'smooth', block: 'start'});
      }, 100);
    });
  }

  statItems = computed(() => {
    const s = this.playerStats();
    if (!s || s.KudoKnowledge === undefined) return [];
    const statsArray = [
      {key: 'KudoKnowledge',  value: s.KudoKnowledge  || 0},
      {key: 'KudoAttendance', value: s.KudoAttendance || 0},
      {key: 'KudoTeamwork',   value: s.KudoTeamwork   || 0},
      {key: 'KudoAtmosphere', value: s.KudoAtmosphere || 0},
      {key: 'KudoEngagement', value: s.KudoEngagement || 0},
    ];
    const totalKudos = statsArray.reduce((acc, curr) => acc + curr.value, 0);
    return statsArray.map(stat => ({
      ...stat,
      percentage: totalKudos > 0 ? Math.round((stat.value / totalKudos) * 100) : 0
    }));
  });

  private tsToPixels(unix: number): number {
    const d = new Date(unix * 1000);
    const minutes = (d.getHours() - TIMELINE_START) * 60 + d.getMinutes();
    return (minutes / 60) * HOUR_PX;
  }

  getEventTop(beginUnix: number): number {
    return Math.max(0, this.tsToPixels(beginUnix));
  }

  getEventHeight(beginUnix: number, endUnix: number): number {
    return Math.max(this.tsToPixels(endUnix) - this.tsToPixels(beginUnix), 28);
  }


  nowLineVisible(): boolean {
    const h = new Date().getHours();
    return h >= TIMELINE_START && h < TIMELINE_END;
  }

  nowLineTop(): number {
    const now = new Date();
    const mins = (now.getHours() - TIMELINE_START) * 60 + now.getMinutes();
    return (mins / 60) * HOUR_PX;
  }

  readonly todayLabel = computed(() => {
    const lang = this.translationService.currentLanguage();
    const locale = lang === 'nl' ? 'nl-BE' : 'en-GB';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  });
}
