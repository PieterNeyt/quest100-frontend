import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GuessResponse, NerdleSession } from '../model/nerdle';

@Injectable({ providedIn: 'root' })
export class NerdleService {
  private readonly http = inject(HttpClient);

  getSession(): Observable<NerdleSession> {
    return this.http.get<NerdleSession>(`/api/nerdle/session`);
  }

  submitGuess(guess: string): Observable<GuessResponse> {
    return this.http.post<GuessResponse>(`/api/nerdle/guess`, { guess });
  }
}
