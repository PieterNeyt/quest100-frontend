import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {switchMap} from 'rxjs';
import {MsalService} from '@azure/msal-angular';
import {environment} from '../../../environment/environment';
import {Profile, SyncProfileResponse} from '../model/profile';
import {Language, TranslationService} from './translationService';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(MsalService);
  private readonly translationService = inject(TranslationService);

  profile = signal<Profile | null>(null);
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

}
