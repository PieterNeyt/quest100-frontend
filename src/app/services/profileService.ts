import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, EMPTY, Observable, switchMap, throwError} from 'rxjs';
import {MsalService} from '@azure/msal-angular';
import {environment} from '../../../environment/environment';
import {
  AwardTransaction,
  KudosEntry,
  Profile,
  ProfileAward,
  ProfileStatistics,
  SyncProfileResponse
} from '../model/profile';
import {Language, TranslationService} from './translationService';
import {InteractionRequiredAuthError} from '@azure/msal-browser';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(MsalService);
  private readonly translationService = inject(TranslationService);

  profile = signal<Profile | null>(null);
  profiles = signal<Profile[] | null>(null);
  profilesAwards = signal<ProfileAward[] | null>(null);
  microsoftProfilePicture = signal('');


  get activeProfilePicture(): string {
    return this.profile()?.customProfilePicture || this.microsoftProfilePicture();
  }

  get hasCustomPicture(): boolean {
    return this.profile()?.customProfilePicture != null;
  }

  syncUser() {
    this.authService.acquireTokenSilent({scopes: ["User.Read"]})
      .pipe(
        catchError(error => {
          if (error instanceof InteractionRequiredAuthError) {
            this.authService.acquireTokenRedirect({ scopes: ["User.Read"] });
            return EMPTY;
          }
          return throwError(() => error);
        }),
        switchMap(response => {
          const graphToken = response.accessToken;
          return this.http.get<SyncProfileResponse>(this.url + "/api/profiles/sync", {
            headers: {'X-Graph-Token': graphToken}
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.profile.set(response.profile);
          this.microsoftProfilePicture.set(response.microsoftProfilePicture);

          if (response.profile.preferredLanguage) {
            const lang = response.profile.preferredLanguage.toLowerCase() as Language;
            this.translationService.setLanguageFromProfile(lang);
          } else {
            this.translationService.setLanguageFromProfile('en');
          }
        },
        error: (error) => {
          console.error('Failed to sync user profile:', error);
          this.translationService.setLanguageFromProfile('en');
        }
      });
  }

  updateProfilePicture(base64Img: string): void {
    this.http.put<Profile>(`${this.url}/api/profiles/picture`, {profilePicture: base64Img})
      .subscribe((updated) => this.profile.set(updated));
  }

  deleteProfilePicture(): void {
    this.http.delete<Profile>(`${this.url}/api/profiles/picture`)
      .subscribe((updated) => this.profile.set(updated));
  }

  getAllProfiles(): void {
    this.http.get<Profile[]>(`${this.url}/api/profiles`)
      .subscribe((profiles) => this.profiles.set(profiles));
  }
  getProfileById(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.url}/api/profiles/${id}`);
  }
  getPlayerStats(): Observable<ProfileStatistics> {
    return this.http.get<ProfileStatistics>(`${this.url}/api/profiles/stats`)
  }
  giveAward(award: AwardTransaction): Observable<Profile> {
    return this.http.post<Profile>(`${this.url}/api/profiles/award`, award);
  }

  getAllProfilesAwards() {
    this.http.get<ProfileAward[]>(`${this.url}/api/profiles/award`)
      .subscribe((profileAwards) => this.profilesAwards.set(profileAwards));
  }

  markProfileAsAwarded(profile: Profile) {
    this.profilesAwards.update(list => {
      if (!list) return list;

      return list.map(pa =>
        pa.profile.id === profile.id
          ? { ...pa, profile, hasSentAward: true }
          : pa
      );
    });
  }
  getLastKudosEntries(): Observable<KudosEntry[]> {
    return this.http.get<KudosEntry[]>(`${this.url}/api/profiles/kudos/recent`);
  }
}
