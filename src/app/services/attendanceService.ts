import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {AttendanceResponse} from '../model/qrcode';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);

  registerAttendance(classId: string): Observable<{
    alreadyRegistered: boolean;
    kudosEarned: number;
    totalKudos: number;
  }> {
    return this.http.post<AttendanceResponse>(
      `/api/profiles/attendance/${classId}`, {}
    ).pipe(
      map(res => ({
        alreadyRegistered: res.alreadyRegistered,
        kudosEarned: res.kudosEarned,
        totalKudos: res.profile.kudos
      }))
    );
  }
}
