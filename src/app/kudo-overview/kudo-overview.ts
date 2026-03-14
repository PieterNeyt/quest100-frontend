import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { CommonModule, DatePipe } from '@angular/common';
import { ProfileService } from '../services/profileService';
import {
  lucideChevronDown, lucideStar, lucideZap,
  lucideUsers, lucideHeart, lucideBookOpen, lucideAward
} from '@ng-icons/lucide';
import { ToastService } from '../services/toastService';
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
  ts = inject(ToastService);
  profile = this.profileService.profile;
  readonly archetypeNames: Record<ArchetypeId, string> = {
    [ArchetypeId.Wizard]: 'Wizard',
    [ArchetypeId.TeamCatalyst]: 'Team Catalyst',
    [ArchetypeId.AtmosphereMaker]: 'Atmosphere Maker',
    [ArchetypeId.CampusExplorer]: 'Campus Explorer',
    [ArchetypeId.AcademicGuardian]: 'Academic Guardian',
  };

  archetypeName = computed(() => {
    const id = this.profile()?.archetypeId;
    if (id === undefined) return '';
    return this.archetypeNames[id as ArchetypeId] ?? 'Unknown';
  });

  activeAccordion = signal<string | null>('stats');
  playerStats = signal<any | null>(null);
  kudoEntries = signal<KudosEntry[]>([]);

  statItems = computed(() => {
    const s = this.playerStats();

    if (!s || s.KudoKnowledge === undefined) {
      return [];
    }

    const statsArray = [
      { label: 'Knowledge', value: s.KudoKnowledge || 0 },
      { label: 'Attendance', value: s.KudoAttendance || 0 },
      { label: 'Teamwork', value: s.KudoTeamwork || 0 },
      { label: 'Atmosphere', value: s.KudoAtmosphere || 0 },
      { label: 'Engagement', value: s.KudoEngagement || 0 }
    ];

    const totalKudos = statsArray.reduce((acc, curr) => acc + curr.value, 0);

    return statsArray.map(stat => ({
      ...stat,
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
    const map: Record<string, string> = {
      KudoKnowledge:  'Knowledge',
      KudoAttendance: 'Attendance',
      KudoTeamwork:   'Teamwork',
      KudoAtmosphere: 'Atmosphere',
      KudoEngagement: 'Engagement',
    };
    return map[type] ?? type;
  }

  toggleAccordion(section: string) {
    if (window.innerWidth > 768) return;
    this.activeAccordion.set(this.activeAccordion() === section ? null : section);
  }

  ngOnInit(): void {
    this.profileService.getPlayerStats()
      .subscribe({
        next: (stats) => this.playerStats.set(stats),
        error: (err) => this.ts.error("Failed to load player stats: " + err.message)
      });

    this.profileService.getLastKudosEntries()
      .subscribe({
        next: (entries) => {
          this.kudoEntries.set(entries)
          console.log(this.kudoEntries);
          console.log(entries);
        },
        error: (err) => this.ts.error("Failed to load kudos: " + err.message)
      });
  }
}
