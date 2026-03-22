import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MoveAction, MoveResponse, SessionResponse } from '../model/minesweeper';

@Injectable({ providedIn: 'root' })
export class MinesweeperService {
  private readonly http = inject(HttpClient);

  getSession(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`/api/minesweeper/session`);
  }

  submitMove(action: MoveAction, row: number, col: number): Observable<MoveResponse> {
    return this.http.post<MoveResponse>(`/api/minesweeper/move`, { action, row, col });
  }
}
