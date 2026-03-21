import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameStatus, GuessResponse, NerdleSession } from '../model/nerdle';

@Injectable({ providedIn: 'root' })
export class NerdleService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/nerdle';

  getToday(): Observable<GameStatus> {
    return this.http.get<GameStatus>(`${this.base}/today`);
  }

  getSession(): Observable<NerdleSession> {
    return this.http.get<NerdleSession>(`${this.base}/session`);
  }

  submitGuess(guess: string): Observable<GuessResponse> {
    return this.http.post<GuessResponse>(`${this.base}/guess`, { guess });
  }
}
