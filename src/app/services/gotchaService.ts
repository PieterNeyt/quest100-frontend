import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface GotchaGame {
  id: string;
  campus: string;
  status: 'OPT_IN' | 'ACTIVE' | 'FINISHED';
  startDate: string | null;
  killDeadlineHours: number;
  winnerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GotchaParticipant {
  id: string;
  gameId: string;
  profileId: string;
  targetId?: string | null;
  isAlive: boolean;
  killDeadline: string;
  killedAt?: string | null;
  killedBy?: string | null;
  optedInAt: string;
  assignedPropId?: string | null;
}

export interface UpdateStartDateRequest {
  startDate: string;
  killDeadlineHours: number;
}

export interface KillFeedProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
}

export interface KillFeedProp {
  id: string;
  name: string;
}

export interface KillFeedItem {
  id: string;
  gameId: string;
  photoUrl: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
  reviewedAt?: string | null;
  hunter: KillFeedProfile;
  victim: KillFeedProfile;
  prop?: KillFeedProp | null;
  likeCount: number;
  likedByMe: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GotchaService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);

  myStatus = signal<GotchaParticipant | null>(null);
  currentGame = signal<GotchaGame | null>(null);

  getCurrentGame(): Observable<GotchaGame | null> {
    return this.http.get<GotchaGame | null>(`${this.url}/api/gotcha/game`).pipe(
      tap((game) => this.currentGame.set(game))
    );
  }

  getMyStatus(): Observable<GotchaParticipant> {
    return this.http.get<GotchaParticipant>(`${this.url}/api/gotcha/me`).pipe(
      tap((status) => this.myStatus.set(status))
    );
  }

  optIn(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/api/gotcha/opt-in`, {});
  }

  optOut(): Observable<void> {
    return this.http.delete<void>(`${this.url}/api/gotcha/opt-in`);
  }

  updateStartDate(payload: UpdateStartDateRequest): Observable<GotchaGame> {
    return this.http.put<GotchaGame>(`${this.url}/api/gotcha/games/startdate`, payload).pipe(
      tap((game) => this.currentGame.set(game))
    );
  }


  submitKill(photoUrl: string): Observable<unknown> {
    return this.http.post(`${this.url}/api/gotcha/kills`, { photoUrl });
  }

  getFeed(limit = 20, offset = 0): Observable<KillFeedItem[]> {
    return this.http.get<KillFeedItem[]>(
      `${this.url}/api/gotcha/feed?limit=${limit}&offset=${offset}`
    );
  }

  likeKill(killId: string): Observable<void> {
    return this.http.post<void>(`${this.url}/api/gotcha/kills/${killId}/like`, {});
  }

  unlikeKill(killId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/api/gotcha/kills/${killId}/like`);
  }
}
