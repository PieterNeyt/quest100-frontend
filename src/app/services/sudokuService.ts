import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MoveResponse, SessionResponse } from '../model/sudoku';

@Injectable({ providedIn: 'root' })
export class SudokuService {
  private readonly http = inject(HttpClient);

  getSession(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`/api/sudoku/session`);
  }

  submitMove(row: number, col: number, value: number): Observable<MoveResponse> {
    return this.http.post<MoveResponse>(`/api/sudoku/move`, { row, col, value });
  }
}
