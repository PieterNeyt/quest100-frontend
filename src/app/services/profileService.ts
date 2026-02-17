import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, switchMap} from 'rxjs';
import {MsalService} from '@azure/msal-angular';
import {environment} from '../../../environment/environment';
import {Profile} from '../model/profile';
import {TranslationService, Language} from './translationService';

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
          return this.http.get<Profile>(this.url + "/api/profiles/sync", {
            headers: {'X-Graph-Token': graphToken}
          }).pipe(map(profile => ({ profile, graphToken })));
        })
      )
      .subscribe({
        next: ({ profile, graphToken }) => {
          this.profile.set(profile);
          this.loadMicrosoftPicture(graphToken);

          if (profile.preferredLanguage) {
            const lang = profile.preferredLanguage.toLowerCase() as Language;
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

  private loadMicrosoftPicture(token: string): void {
    this.http
      .get<{ profilePicture: string }>(this.url + '/api/profiles/picture', {
        headers: { 'X-Graph-Token': token },
      })
      .subscribe({
        next: ({ profilePicture }) => this.microsoftProfilePicture.set(profilePicture),
        error: () => this.microsoftProfilePicture.set(''),
      });
  }

  updateProfilePicture(base64Img: string): void {
    this.http.put<Profile>(`${this.url}/api/profiles/picture`, { profilePicture: base64Img })
      .subscribe((updated) => this.profile.set(updated));
  }

  deleteProfilePicture(): void {
    this.http.delete<Profile>(`${this.url}/api/profiles/picture`)
      .subscribe((updated) => this.profile.set(updated));
  }

}
