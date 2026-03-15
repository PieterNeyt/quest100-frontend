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
import {ToastService} from '../services/toastService';
import {Router} from '@angular/router';
import {ArchetypeId} from '../model/profile';

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

  playerStats = signal<any | null>(null);
  activeAccordion = signal<string | null>('profile');

  toggleAccordion(section: string) {
    if (window.innerWidth > 768) return;
    this.activeAccordion.set(this.activeAccordion() === section ? null : section);
  }

  navigateToAbout(appKey: string) {
    this.router.navigate(['/about']).then(() => {
      setTimeout(() => {
        const element = document.getElementById('section-' + appKey);
        if (element) {
          element.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      }, 100);
    });
  }

  statItems = computed(() => {
    const s = this.playerStats();

    if (!s || s.KudoKnowledge === undefined) {
      return [];
    }

    const statsArray = [
      {key: 'KudoKnowledge', value: s.KudoKnowledge || 0},
      {key: 'KudoAttendance', value: s.KudoAttendance || 0},
      {key: 'KudoTeamwork', value: s.KudoTeamwork || 0},
      {key: 'KudoAtmosphere', value: s.KudoAtmosphere || 0},
      {key: 'KudoEngagement', value: s.KudoEngagement || 0},
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
