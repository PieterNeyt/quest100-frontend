import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {switchMap} from 'rxjs';
import {MsalService} from '@azure/msal-angular';
import {environment} from '../../../environment/environment';
import {Profile} from '../model/profile';
import {TranslationService, Language} from './translationService';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private url = environment.apiConfig.uri;
  private http = inject(HttpClient)
  private authService = inject(MsalService)
  private translationService = inject(TranslationService);
  profile = signal<Profile | null>(null);

  syncUser() {
    this.authService.acquireTokenSilent({scopes: ["User.Read"]})
      .pipe(
        switchMap(response => {
          const graphToken = response.accessToken;
          return this.http.get<Profile>(this.url + "/api/profiles/sync", {
            headers: {'X-Graph-Token': graphToken}
          });
        })
      )
      .subscribe({
        next: (profile: Profile) => {
          this.profile.set(profile);

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
}
