import {AfterViewInit, Component, inject,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {TranslationService} from '../services/translationService';

interface AppEntry {
  key: string;
  icon: string;
  accentHex: string;
  accentSoft: string;
  logoUrl: string;
  url: string;
  features: string[];
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent implements AfterViewInit {
  readonly t = inject(TranslationService);

  apps: AppEntry[] = [
    {
      key: 'intranet',
      icon: 'lucideLayoutDashboard',
      accentHex: '#0078d4',
      accentSoft: 'rgba(0,120,212,0.08)',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Microsoft_Office_SharePoint_%282025%E2%80%93present%29.svg/250px-Microsoft_Office_SharePoint_%282025%E2%80%93present%29.svg.png',
      url: 'https://studentkdg.sharepoint.com/_layouts/15/sharepoint.aspx',
      features: [
        'about.apps.intranet.f1',
        'about.apps.intranet.f2',
        'about.apps.intranet.f3',
      ],
    },
    {
      key: 'canvas',
      icon: 'lucideGraduationCap',
      accentHex: '#e66000',
      accentSoft: 'rgba(230,96,0,0.08)',
      logoUrl: 'https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1706635559/oxnardsdorg/a3jmgjuc95vnrlbehc4j/canvas-logo-1024x1020.png',
      url: 'https://canvas.kdg.be/',
      features: [
        'about.apps.canvas.f1',
        'about.apps.canvas.f2',
        'about.apps.canvas.f3',
      ],
    },
    {
      key: 'timeedit',
      icon: 'lucideCalendarDays',
      accentHex: '#1d4ed8',
      accentSoft: 'rgba(29,78,216,0.08)',
      logoUrl: 'https://cdn.prod.website-files.com/64e6e4222dd4319151d1537d/652641e10a74cd0d04dd1da5_TE%20Logo%20Symbol.png',
      url: 'https://cloud.timeedit.net',
      features: [
        'about.apps.timeedit.f1',
        'about.apps.timeedit.f2',
        'about.apps.timeedit.f3',
      ],
    },
    {
      key: 'estudentservice',
      icon: 'lucideClipboardList',
      accentHex: '#059669',
      accentSoft: 'rgba(5,150,105,0.08)',
      logoUrl: 'https://a.storyblok.com/f/226028/2000x2500/021b91e4b7/placeholder-kdg-mobile.webp',
      url: 'https://e-studentservice.kdg.be/Main.aspx',
      features: [
        'about.apps.estudentservice.f1',
        'about.apps.estudentservice.f2',
        'about.apps.estudentservice.f3',
        'about.apps.estudentservice.f4',
      ],
    },
    {
      key: 'ects',
      icon: 'lucideBookOpen',
      accentHex: '#059669',
      accentSoft: 'rgba(5,150,105,0.08)',
      logoUrl: 'https://a.storyblok.com/f/226028/2000x2500/021b91e4b7/placeholder-kdg-mobile.webp',
      url: 'https://ects.kdg.be/ECTSv3',
      features: [
        'about.apps.ects.f1',
        'about.apps.ects.f2',
        'about.apps.ects.f3',
      ],
    },
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  scrollToSection(appKey: string) {
    const element = document.getElementById('section-' + appKey);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
