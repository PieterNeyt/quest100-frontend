import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {NgIcon, provideIcons} from "@ng-icons/core";
import {CommonModule} from '@angular/common';
import {ProfileService} from '../services/profileService';
import {
  lucideChevronDown,
  lucideInfo,
  lucideQrCode,
  lucideStar,
  lucideTarget,
  lucideUsers,
  lucideZap
} from '@ng-icons/lucide';
import {TranslationService} from '../services/translationService';
import {tap} from 'rxjs';
import {ToastService} from '../services/toastService';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIcon, CommonModule],
  providers: [provideIcons({
    lucideQrCode, lucideStar, lucideZap, lucideTarget,
    lucideUsers, lucideInfo, lucideChevronDown
  })],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly profileService = inject(ProfileService);
  translationService = inject(TranslationService);
  profile = this.profileService.profile;
  ts = inject(ToastService)

  // We initialiseren de signal als null
  playerStats = signal<any | null>(null);
  activeAccordion = signal<string | null>('profile');

  toggleAccordion(section: string) {
    if (window.innerWidth > 768) return;
    this.activeAccordion.set(this.activeAccordion() === section ? null : section);
  }

  // De computed signal reageert pas zodra playerStats een waarde krijgt
  statItems = computed(() => {
    const s = this.playerStats();

    // Harde check: als er geen data is, of de data is nog niet compleet (check op KudoKnowledge), return lege array
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

  ngOnInit(): void {
    this.profileService.getPlayerStats()
      .subscribe({
        next: (stats) => {
          this.playerStats.set(stats);
        },
        error: (err) => this.ts.error("Failed to load player stats: " + err.message)
      });
  }
}
