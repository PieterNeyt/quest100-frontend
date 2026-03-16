import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {NgIcon, provideIcons} from "@ng-icons/core";
import {CommonModule, DatePipe} from '@angular/common';
import {ProfileService} from '../services/profileService';
import {
  lucideAward,
  lucideBookOpen,
  lucideChevronDown,
  lucideHeart,
  lucideStar,
  lucideUsers,
  lucideZap
} from '@ng-icons/lucide';
import {ToastService} from '../services/toastService';
import {TranslationService} from '../services/translationService';
import {ArchetypeId, KudosEntry} from '../model/profile';

@Component({
  selector: 'app-kudo-overview',
  standalone: true,
  imports: [NgIcon, CommonModule, DatePipe],
  providers: [provideIcons({
    lucideChevronDown, lucideStar, lucideZap,
    lucideUsers, lucideHeart, lucideBookOpen, lucideAward
  })],
  templateUrl: './kudo-overview.html',
  styleUrl: './kudo-overview.css',
})
export class KudoOverview implements OnInit {
  private readonly profileService = inject(ProfileService);
  readonly t = inject(TranslationService);
  ts = inject(ToastService);
  profile = this.profileService.profile;

  readonly archetypeNames = computed<Record<ArchetypeId, string>>(() => ({
    [ArchetypeId.Wizard]:           this.t.t('home.archetypes.wizard'),
    [ArchetypeId.TeamCatalyst]:     this.t.t('home.archetypes.teamCatalyst'),
    [ArchetypeId.AtmosphereMaker]:  this.t.t('home.archetypes.atmosphereMaker'),
    [ArchetypeId.CampusExplorer]:   this.t.t('home.archetypes.campusExplorer'),
    [ArchetypeId.AcademicGuardian]: this.t.t('home.archetypes.academicGuardian'),
  }));

  archetypeName = computed(() => {
    const id = this.profile()?.archetypeId;
    if (id === undefined) return '';
    return this.archetypeNames()[id as ArchetypeId] ?? 'Unknown';
  });

  activeAccordion = signal<string | null>('stats');
  playerStats = signal<any | null>(null);
  kudoEntries = signal<KudosEntry[]>([]);

  statItems = computed(() => {
    const s = this.playerStats();
    if (!s || s.KudoKnowledge === undefined) return [];

    const statsArray = [
      { key: 'KudoKnowledge',  value: s.KudoKnowledge  || 0 },
      { key: 'KudoAttendance', value: s.KudoAttendance || 0 },
      { key: 'KudoTeamwork',   value: s.KudoTeamwork   || 0 },
      { key: 'KudoAtmosphere', value: s.KudoAtmosphere || 0 },
      { key: 'KudoEngagement', value: s.KudoEngagement || 0 },
    ];

    const totalKudos = statsArray.reduce((acc, curr) => acc + curr.value, 0);

    return statsArray.map(stat => ({
      ...stat,
      label: this.t.t('kudoTypes.' + stat.key),
      percentage: totalKudos > 0 ? Math.round((stat.value / totalKudos) * 100) : 0
    }));
  });

  getIconForType(type: string): string {
    const map: Record<string, string> = {
      KudoKnowledge:  'lucideBookOpen',
      KudoAttendance: 'lucideStar',
      KudoTeamwork:   'lucideUsers',
      KudoAtmosphere: 'lucideHeart',
      KudoEngagement: 'lucideZap',
    };
    return map[type] ?? 'lucideAward';
  }

  getLabelForType(type: string): string {
    return this.t.t('kudoTypes.' + type);
  }

  toggleAccordion(section: string) {
    if (window.innerWidth > 768) return;
    this.activeAccordion.set(this.activeAccordion() === section ? null : section);
  }

  ngOnInit(): void {
    this.profileService.getPlayerStats().subscribe({
      next: (stats) => this.playerStats.set(stats),
      error: (err) => this.ts.error("Failed to load player stats: " + err.message)
    });

    this.profileService.getLastKudosEntries().subscribe({
      next: (entries) => this.kudoEntries.set(entries),
      error: (err) => this.ts.error("Failed to load kudos: " + err.message)
    });
  }
}
