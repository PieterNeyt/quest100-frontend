import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {ProfileService} from '../services/profileService';
import {CommonModule} from '@angular/common';
import {AwardTransaction, KudoType, Profile} from '../model/profile';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../services/toastService';
import {TranslationService} from '../services/translationService';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideSearch, lucideTrophy, lucideChevronRight} from '@ng-icons/lucide';
import {LeaderboardService} from '../services/leaderboardService';
import {Leaderboard} from '../model/leaderboard';
import {Router} from '@angular/router';
import {LeaderboardModalComponent} from '../leaderboard-modal/leaderboard-modal';

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, LeaderboardModalComponent],
  providers: [provideIcons({lucideSearch, lucideTrophy, lucideChevronRight})],
  templateUrl: './userlist.html',
  styleUrl: './userlist.css',
})
export class Userlist implements OnInit {
  private profileService = inject(ProfileService);
  private leaderboardService = inject(LeaderboardService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  public translate = inject(TranslationService);

  profileAwards = this.profileService.profilesAwards;
  courses = this.leaderboardService.courses;
  courseLeaderboards = this.leaderboardService.courseLeaderboards;

  showStandingsModal = signal(false);
  standingsLeaderboard = signal<Leaderboard | null>(null);
  showHistoryModal = signal(false);

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
    const query = this.searchQuery().toLowerCase();
    const classId = this.selectedClassId();
    const awards = this.profileAwards() ?? [];

    return awards.filter(pa => {
      if (pa.profile.id === myId) return false;
      if (myCourseId && pa.profile.class?.CourseId !== myCourseId) return false;
      if (classId && pa.profile.class?.Id !== classId) return false;
      if (query) {
        const fullName = `${pa.profile.firstName} ${pa.profile.lastName}`.toLowerCase();
        if (!fullName.includes(query)) return false;
      }
      return true;
    });
  });

  activeLeaderboard = computed<Leaderboard | null>(() => {
    const now = new Date();
    return this.courseLeaderboards().find(lb => {
      const start = new Date(lb.StartDate);
      const end = new Date(lb.EndDate);
      return now >= start && now <= end;
    }) ?? null;
  });

  upcomingLeaderboard = computed<Leaderboard | null>(() => {
    const now = new Date();
    return this.courseLeaderboards()
      .filter(lb => new Date(lb.StartDate) > now)
      .sort((a, b) => new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime())[0] ?? null;
  });

  finishedLeaderboards = computed<Leaderboard[]>(() => {
    const now = new Date();
    return this.courseLeaderboards()
      .filter(lb => new Date(lb.EndDate) < now)
      .sort((a, b) => new Date(b.EndDate).getTime() - new Date(a.EndDate).getTime());
  });

  ngOnInit() {
    this.profileService.getAllProfilesAwards();
    this.leaderboardService.getAllCoursesWithClasses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
      }
    });
  }

  constructor() {
    effect(() => {
      if (this.myProfile) {
        const courseId = this.myProfile()?.class?.CourseId;
        if (courseId) {
          this.leaderboardService.getLeaderboardsByCourseId(courseId!).subscribe();
        }
      }
    });
  }

  openModal(profile: Profile) {
    this.selectedProfile.set(profile);
  }

  closeModal() {
    this.selectedProfile.set(null);
    this.message = '';
  }

  openStandingsModal(lb: Leaderboard) {
    this.standingsLeaderboard.set(lb);
    this.showStandingsModal.set(true);
  }

  closeStandingsModal() {
    this.showStandingsModal.set(false);
    this.standingsLeaderboard.set(null);
  }

  openHistoryModal() {
    this.showHistoryModal.set(true);
  }

  closeHistoryModal() {
    this.showHistoryModal.set(false);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
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
        this.toastService.success(`Sent ${this.selectedType} to ${updatedProfile.firstName} ${updatedProfile.lastName}`);
        this.profileService.markProfileAsAwarded(updatedProfile);
        this.closeModal();
      },
      error: () => {
        this.toastService.error('Failed to send award. Please try again.');
      }
    });
  }

  getKudoLabel(type: KudoType): string {
    return this.translate.tk(type);
  }
}
