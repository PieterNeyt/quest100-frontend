import {Component, inject} from '@angular/core';
import {HlmBadge} from "@spartan-ng/helm/badge";
import {HlmButton} from "@spartan-ng/helm/button";
import {HlmCard, HlmCardContent, HlmCardDescription, HlmCardHeader, HlmCardTitle} from "@spartan-ng/helm/card";
import {HlmIcon} from "@spartan-ng/helm/icon";
import {NgIcon, provideIcons} from "@ng-icons/core";
import {ProfileService} from '../services/profileService';
import {lucideQrCode, lucideStar, lucideTarget, lucideUsers, lucideZap} from '@ng-icons/lucide';

@Component({
  selector: 'app-home',
  imports: [
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmCardContent,
    HlmCardDescription,
    HlmCardHeader,
    HlmCardTitle,
    HlmIcon,
    NgIcon
  ],
  providers: [provideIcons({lucideQrCode, lucideStar, lucideZap, lucideTarget, lucideUsers})],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  profile = inject(ProfileService).profile;
  stats = [
    {label: 'Total Kudos', value: '847', icon: 'lucideStar', color: 'text-yellow-400'},
    {label: 'Day Streak', value: '5', icon: 'lucideZap', color: 'text-orange-500'},
    {label: 'Quests Done', value: '8', icon: 'lucideTarget', color: 'text-blue-400'},
    {label: 'Connections', value: '42', icon: 'lucideUsers', color: 'text-green-400'},
  ];
}
