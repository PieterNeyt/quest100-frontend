import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AttendanceResponse } from '../model/qrcode';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private url = environment.apiConfig.uri;
  private http = inject(HttpClient);

  registerAttendance(classId: string): Observable<{
    alreadyRegistered: boolean;
    kudosEarned: number;
    totalKudos: number;
  }> {
    return this.http.post<AttendanceResponse>(
      `${this.url}/api/profiles/attendance/${classId}`, {}
    ).pipe(
      map(res => ({
        alreadyRegistered: res.alreadyRegistered,
        kudosEarned: res.kudosEarned,
        totalKudos: res.profile.kudos
      }))
    );
  }
}
