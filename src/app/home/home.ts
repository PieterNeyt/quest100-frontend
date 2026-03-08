import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { CommonModule } from '@angular/common';
import { ProfileService } from '../services/profileService';
import {
  lucideInfo, lucideQrCode, lucideStar, lucideTarget,
  lucideUsers, lucideZap, lucideChevronDown
} from '@ng-icons/lucide';
import { TranslationService } from '../services/translationService';
import { ProfileStatistics } from '../model/profile';
import { tap } from 'rxjs';

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

    // Gebruik de hoofdletters zoals ze uit je API komen (gebaseerd op je log)
    const statsArray = [
      { label: 'Knowledge', value: s.KudoKnowledge || 0 },
      { label: 'Attendance', value: s.KudoAttendance || 0 },
      { label: 'Teamwork', value: s.KudoTeamwork || 0 },
      { label: 'Atmosphere', value: s.KudoAtmosphere || 0 },
      { label: 'Engagement', value: s.KudoEngagement || 0 }
    ];

    const totalKudos = statsArray.reduce((acc, curr) => acc + curr.value, 0);

    const calculatedStats = statsArray.map(stat => ({
      ...stat,
      // De bar wordt opgevuld op basis van het aandeel in het totaal
      percentage: totalKudos > 0 ? Math.round((stat.value / totalKudos) * 100) : 0
    }));

    console.log('✅ Stats succesvol ingeladen en berekend:', calculatedStats);
    return calculatedStats;
  });

  ngOnInit(): void {
    this.profileService.getPlayerStats()
      .pipe(
        tap(stats => console.log('🚀 API Response:', stats))
      )
      .subscribe({
        next: (stats) => {
          // Zodra we de set doen, wordt de 'statItems' computed automatisch wakker
          this.playerStats.set(stats);
        },
        error: (err) => console.error('❌ Error:', err)
      });
  }
}
