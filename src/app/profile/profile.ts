import {Component, inject} from '@angular/core';
import {ProfileService} from '../services/profileService';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  public t = inject(TranslationService);
  private profileService = inject(ProfileService);

  profile = this.profileService.profile;

  get profilePicture(): string {
    return this.profileService.activeProfilePicture;
  }

  get hasCustomPicture(): boolean {
    return this.profileService.hasCustomPicture;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.profileService.updateProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(input.files[0]);
  }

  deletePicture() {
    this.profileService.deleteProfilePicture();
  }
}
