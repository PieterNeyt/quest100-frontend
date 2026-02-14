import {Component, inject} from '@angular/core';
import {ProfileService} from '../services/profileService';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: [],
})
export class Profile {
  public t = inject(TranslationService);
  profile = inject(ProfileService).profile;
}
