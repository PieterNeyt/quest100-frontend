import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ProfileService } from '../services/profileService';
import { CommonModule } from '@angular/common';
import { AwardTransaction, KudoType, Profile } from '../model/profile';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toastService';
import { TranslationService } from '../services/translationService';

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './userlist.html',
  styleUrl: './userlist.css',
})
export class Userlist implements OnInit {
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);
  public translate = inject(TranslationService);

  profileAwards = this.profileService.profilesAwards;
  selectedProfile = signal<Profile | null>(null);
  message = '';
  selectedType = KudoType.KudoTeamwork;

  kudoTypes = Object.values(KudoType);

  filteredProfileAwards = computed(() => {
    const myId = this.profileService.profile()?.id;
    const awards = this.profileAwards() ?? [];
    return awards.filter(pa => pa.profile.id !== myId);
  });

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
    if (!profile || !this.message.trim()) return;

    const award: AwardTransaction = {
      receiver: profile.id,
      type: this.selectedType,
      message: this.message
    };

    this.profileService.giveAward(award).subscribe({
      next: (updatedProfile: Profile) => {
        const message = this.translate.tp('userlist.awardSuccess', {
          type: this.translate.tk(this.selectedType),
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName
        });
        this.toastService.success(message);

        this.profileService.markProfileAsAwarded(updatedProfile);

        this.closeModal();
      },
      error: () => {
        this.toastService.error(
          this.translate.t('userlist.awardError')
        );
      }
    });
  }

  getKudoLabel(type: KudoType): string {
    return this.translate.tk(type);
  }
}
