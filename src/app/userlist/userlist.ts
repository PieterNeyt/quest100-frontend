import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

  profileAwards = this.profileService.profilesAwards;


  filteredProfileAwards = computed(() => {
    const myId = this.profileService.profile()?.id;
    return this.profileAwards()!.filter(pa => pa.profile.id !== myId);
  });

  kudoTypes = Object.values(KudoType);
  selectedProfile = signal<Profile | null>(null);
  message = '';
  selectedType = KudoType.KudoTeamwork;

  ngOnInit() {
    this.profileService.getAllProfilesAwards();
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

    if (profile && this.message.trim()) {
      const award: AwardTransaction = {
        receiver: profile.id,
        type: this.selectedType,
        message: this.message
      };

      this.profileService.giveAward(award);
      this.profileService.getAllProfilesAwards();
      this.closeModal();
    }
  }
}
