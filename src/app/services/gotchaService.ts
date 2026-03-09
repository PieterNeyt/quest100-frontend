import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import {
  CreatePropRequest,
  EndScreen,
  GotchaGame,
  GotchaProp,
  GotchaParticipant,
  KillFeedItem,
  TargetInfo,
  UpdateGameRequest,
  UpdatePropRequest,
} from '../model/gotcha';

export type {
  GotchaGame, GotchaParticipant, KillFeedItem, TargetInfo,
  UpdateGameRequest, EndScreen, GotchaProp,
};

@Injectable({ providedIn: 'root' })
export class GotchaService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);

  // Shared state signals
  myStatus    = signal<GotchaParticipant | null>(null);
  currentGame = signal<GotchaGame | null>(null);
  targetInfo  = signal<TargetInfo | null>(null);
  endScreen   = signal<EndScreen | null>(null);

  countdown = signal<{h: number, m: number, s: number} | null>(null);
  private timer: any;

  constructor() {
    this.startGlobalTimer();
  }

  private startGlobalTimer() {
    this.timer = setInterval(() => {
      const deadline = this.targetInfo()?.killDeadline;
      const game = this.currentGame();

      const targetDate = (game?.status === 'OPT_IN' && game.startDate)
        ? game.startDate
        : deadline;

      if (!targetDate) {
        this.countdown.set(null);
        return;
      }

      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        this.countdown.set({h:0, m:0, s:0});
      } else {
        const totalSecs = Math.floor(diff / 1000);
        this.countdown.set({
          h: Math.floor(totalSecs / 3600),
          m: Math.floor((totalSecs % 3600) / 60),
          s: totalSecs % 60
        });
      }
    }, 1000);
  }

  // Game

  getCurrentGame(): Observable<GotchaGame | null> {
    return this.http.get<GotchaGame | null>(`${this.url}/api/gotcha/game`).pipe(
      tap((game) => this.currentGame.set(game))
    );
  }

  updateGame(payload: UpdateGameRequest): Observable<GotchaGame> {
    return this.http.put<GotchaGame>(`${this.url}/api/gotcha/games/startdate`, payload).pipe(
      tap((game) => this.currentGame.set(game))
    );
  }

  // Participation

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

  // Kills

  submitKill(photoBase64: string): Observable<unknown> {
    return this.http.post(`${this.url}/api/gotcha/kills`, { photoBase64 });
  }

  reviewKill(killId: string, approve: boolean): Observable<void> {
    return this.http.put<void>(`${this.url}/api/gotcha/kills/${killId}/review`, { approve });
  }

  getNextPendingKill(): Observable<KillFeedItem | null> {
    return this.http.get<KillFeedItem | null>(`${this.url}/api/gotcha/kills/pending/next`);
  }

  getPendingKillCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.url}/api/gotcha/kills/pending/count`);
  }


  // Feed

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

  // End screen

  getEndScreen(): Observable<EndScreen> {
    return this.http.get<EndScreen>(`${this.url}/api/gotcha/end-screen`).pipe(
      tap((data) => this.endScreen.set(data))
    );
  }

  // Props

  getAllProps(): Observable<GotchaProp[]> {
    return this.http.get<GotchaProp[]>(`${this.url}/api/gotcha/props`);
  }

  createProp(payload: CreatePropRequest): Observable<GotchaProp> {
    return this.http.post<GotchaProp>(`${this.url}/api/gotcha/props`, payload);
  }

  updateProp(id: string, payload: UpdatePropRequest): Observable<GotchaProp> {
    return this.http.put<GotchaProp>(`${this.url}/api/gotcha/props/${id}`, payload);
  }

  deleteProp(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/api/gotcha/props/${id}`);
  }
}
