import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  CreateLeaderboardRequest,
  Leaderboard,
  UpdateLeaderboardRequest,
} from '../model/leaderboard';
import {Course} from '../model/class';


@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly http = inject(HttpClient);

  leaderboards = signal<Leaderboard[]>([]);
  currentLeaderboard = signal<Leaderboard | null>(null);
  courses = signal<Course[]>([]);


  getAllCoursesWithClasses(): Observable<Course[]> {
    return this.http.get<Course[]>(`/api/leaderboard/courses`).pipe(
      tap((courses) => this.courses.set(courses))
    );
  }

  createLeaderboard(payload: CreateLeaderboardRequest): Observable<Leaderboard> {
    return this.http.post<Leaderboard>(`/api/leaderboard`, payload).pipe(
      tap((lb) => {
        this.currentLeaderboard.set(lb);
        this.leaderboards.update((list) => [...list, lb]);
      })
    );
  }

  getLeaderboardByID(id: string): Observable<Leaderboard> {
    return this.http.get<Leaderboard>(`/api/leaderboard/${id}`);
  }

  getAllLeaderboards(): Observable<Leaderboard[]> {
    return this.http.get<Leaderboard[]>(`/api/leaderboard`).pipe(
      tap(list => this.leaderboards.set(list))
    );
  }

  updateLeaderboard(id: string, payload: UpdateLeaderboardRequest): Observable<Leaderboard> {
    return this.http.put<Leaderboard>(`/api/leaderboard/${id}`, payload).pipe(
      tap((lb) => {
        this.currentLeaderboard.set(lb);
        this.leaderboards.update((list) =>
          list.map((item) => (item.Id === id ? lb : item))
        );
      })
    );
  }
}
