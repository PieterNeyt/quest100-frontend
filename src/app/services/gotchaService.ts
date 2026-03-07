import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import {
  GotchaGame,
  GotchaParticipant,
  KillFeedItem,
  TargetInfo,
  UpdateStartDateRequest,
} from '../model/gotcha';

// Re-export for components that previously imported from here
export type { GotchaGame, GotchaParticipant, KillFeedItem, TargetInfo, UpdateStartDateRequest };

@Injectable({
  providedIn: 'root',
})
export class GotchaService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);

  myStatus = signal<GotchaParticipant | null>(null);
  currentGame = signal<GotchaGame | null>(null);
  targetInfo = signal<TargetInfo | null>(null);

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

  getTargetInfo(): Observable<TargetInfo> {
    return this.http.get<TargetInfo>(`${this.url}/api/gotcha/me/target`).pipe(
      tap((info) => this.targetInfo.set(info))
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

  getPendingKills(): Observable<KillFeedItem[]> {
    return this.http.get<KillFeedItem[]>(`${this.url}/api/gotcha/kills/pending`);
  }

  reviewKill(killId: string, approve: boolean): Observable<void> {
    return this.http.put<void>(`${this.url}/api/gotcha/kills/${killId}/review`, { approve });
  }
}
