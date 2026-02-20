import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ProfileService } from './profileService';
import {firstValueFrom} from 'rxjs';

const DEMO_TOKEN_KEY = 'demo_token';
const DEMO_PROFILE_KEY = 'demo_profile';

@Injectable({ providedIn: 'root' })
export class DemoAuthService {
  private http = inject(HttpClient);
  private url = environment.apiConfig.uri;
  private profileService = inject(ProfileService);  // DEMO

  isDemoUser = signal(false);
  private _token: string | null = null;

  constructor() {
    const storedToken = sessionStorage.getItem(DEMO_TOKEN_KEY);
    const storedProfile = sessionStorage.getItem(DEMO_PROFILE_KEY);

    if (storedToken && storedProfile) {
      this._token = storedToken;
      this.isDemoUser.set(true);
      this.profileService.profile.set(JSON.parse(storedProfile));
    }
  }

  get token(): string | null {
    return this._token;
  }

  async login(firstName: string, lastName: string): Promise<any> {
    const res = await firstValueFrom(this.http.post<{ token: string; profile: any }>(
      `${this.url}/api/demo/login`, { firstName, lastName }
    ));

    this._token = res.token;
    sessionStorage.setItem(DEMO_TOKEN_KEY, res.token);
    sessionStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(res.profile)); // Sla profiel op

    this.isDemoUser.set(true);
    this.profileService.profile.set(res.profile);
    return res;
  }

  logout(): void {
    this._token = null;
    sessionStorage.removeItem(DEMO_TOKEN_KEY);
    sessionStorage.removeItem(DEMO_PROFILE_KEY); // Verwijder profiel
    this.isDemoUser.set(false);
    this.profileService.profile.set(null); // Clear profiel
  }
}
