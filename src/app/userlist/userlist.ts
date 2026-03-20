import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ProfileService} from '../services/profileService';
import {CommonModule} from '@angular/common';
import {AwardTransaction, KudoType, Profile} from '../model/profile';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../services/toastService';
import {TranslationService} from '../services/translationService';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideSearch} from '@ng-icons/lucide';
import {LeaderboardService} from '../services/leaderboardService';

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({lucideSearch})],
  templateUrl: './userlist.html',
  styleUrl: './userlist.css',
})
export class Userlist implements OnInit {
  private profileService = inject(ProfileService);
  private leaderboardService = inject(LeaderboardService);
  private toastService = inject(ToastService);
  public translate = inject(TranslationService);

  profileAwards = this.profileService.profilesAwards;
  courses = this.leaderboardService.courses;

  selectedProfile = signal<Profile | null>(null);
  searchQuery = signal('');
  selectedClassId = signal('');
  message = '';
  selectedType = KudoType.KudoTeamwork;
  kudoTypes = Object.values(KudoType);

  private myProfile = this.profileService.profile;

  availableClasses = computed(() => {
    const myCourseId = this.myProfile()?.class?.CourseId;
    if (!myCourseId) return [];
    const course = this.courses().find(c => c.Id === myCourseId);
    return course?.Classes ?? [];
  });

  filteredProfileAwards = computed(() => {
    const myId = this.myProfile()?.id;
    const myCourseId = this.myProfile()?.class?.CourseId;
    const awards = this.profileAwards() ?? [];

    return awards.filter(pa => {
      if (pa.profile.id === myId) return false;

      // Only show people from the same course
      if (myCourseId && pa.profile.class?.CourseId !== myCourseId) return false;

      return true;
    });
  });

  ngOnInit() {
    this.profileService.getAllProfilesAwards();
    this.leaderboardService.getAllCoursesWithClasses().subscribe();
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
        this.toastService.error('userlist.awardError');
      }
    });
  }

  getKudoLabel(type: KudoType): string {
    return this.translate.tk(type);
  }
}
