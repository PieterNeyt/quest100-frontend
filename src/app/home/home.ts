import {Component, inject} from '@angular/core';
import {NgIcon, provideIcons} from "@ng-icons/core";
import {ProfileService} from '../services/profileService';
import {lucideInfo, lucideQrCode, lucideStar, lucideTarget, lucideUsers, lucideZap} from '@ng-icons/lucide';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-home',
  imports: [
    NgIcon
  ],
  providers: [provideIcons({lucideQrCode, lucideStar, lucideZap, lucideTarget, lucideUsers,lucideInfo})],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  profile = inject(ProfileService).profile;
  translationService = inject(TranslationService);


}
