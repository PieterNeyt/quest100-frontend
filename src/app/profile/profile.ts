import {Component, inject} from '@angular/core';
import {ProfileService} from '../services/profileService';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: [],
})
export class Profile {
  profile = inject(ProfileService).profile;
}
