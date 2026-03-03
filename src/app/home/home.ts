import {Component, inject} from '@angular/core';
import {provideIcons} from "@ng-icons/core";
import {ProfileService} from '../services/profileService';
import {lucideQrCode, lucideStar, lucideTarget, lucideUsers, lucideZap} from '@ng-icons/lucide';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-home',
  imports: [],
  providers: [provideIcons({lucideQrCode, lucideStar, lucideZap, lucideTarget, lucideUsers})],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  profile = inject(ProfileService).profile;
  translationService = inject(TranslationService);
  stats = [
    {label: 'Total Kudos', value: '847', icon: 'lucideStar', color: 'text-yellow-400'},
    {label: 'Day Streak', value: '5', icon: 'lucideZap', color: 'text-orange-500'},
    {label: 'Quests Done', value: '8', icon: 'lucideTarget', color: 'text-blue-400'},
    {label: 'Connections', value: '42', icon: 'lucideUsers', color: 'text-green-400'},
  ];
}
