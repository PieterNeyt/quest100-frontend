import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import {
  EndScreen,
  GotchaGame,
  GotchaParticipant,
  KillFeedItem,
  TargetInfo,
  UpdateStartDateRequest,
} from '../model/gotcha';

export type { GotchaGame, GotchaParticipant, KillFeedItem, TargetInfo, UpdateStartDateRequest, EndScreen };

@Injectable({ providedIn: 'root' })
export class GotchaService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);

  myStatus = signal<GotchaParticipant | null>(null);
  currentGame = signal<GotchaGame | null>(null);
  targetInfo = signal<TargetInfo | null>(null);
  endScreen = signal<EndScreen | null>(null);

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

  getEndScreen(): Observable<EndScreen> {
    return this.http.get<EndScreen>(`${this.url}/api/gotcha/end-screen`).pipe(
      tap((data) => this.endScreen.set(data))
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

  /** @deprecated use getNextPendingKill for the FIFO review UI */
  getPendingKills(): Observable<KillFeedItem[]> {
    return this.http.get<KillFeedItem[]>(`${this.url}/api/gotcha/kills/pending`);
  }

  /** Returns the single oldest pending kill (FIFO). 204 = nothing to review. */
  getNextPendingKill(): Observable<KillFeedItem | null> {
    return this.http.get<KillFeedItem | null>(`${this.url}/api/gotcha/kills/pending/next`);
  }

  /** Returns { count: number } of pending kills waiting for review. */
  getPendingKillCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.url}/api/gotcha/kills/pending/count`);
  }

  reviewKill(killId: string, approve: boolean): Observable<void> {
    return this.http.put<void>(`${this.url}/api/gotcha/kills/${killId}/review`, { approve });
  }
}
