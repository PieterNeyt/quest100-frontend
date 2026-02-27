import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfileService } from '../services/profileService';
import { CommonModule } from '@angular/common';
import { AwardTransaction, KudoType, Profile } from '../model/profile';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './userlist.html',
  styleUrl: './userlist.css',
})
export class Userlist implements OnInit {
  private profileService = inject(ProfileService);

  profiles = this.profileService.profiles;
  kudoTypes = Object.values(KudoType);

  selectedProfile = signal<Profile | null>(null);
  message = '';
  selectedType = KudoType.KudoTeamwork;

  ngOnInit() {
    this.profileService.getAllProfiles();
  }

  openModal(profile: Profile) {
    this.selectedProfile.set(profile);
  }

  closeModal() {
    this.selectedProfile.set(null);
    this.message = '';
  }

  submitAward() {
    const profile = this.selectedProfile();
    if (profile) {
      const award: AwardTransaction = {
        receiver: profile.id,
        type: this.selectedType,
        message: this.message
      };

      this.profileService.giveAward(award);
      this.closeModal();
    }
  }
}
