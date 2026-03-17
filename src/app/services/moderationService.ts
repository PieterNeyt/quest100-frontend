import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Report} from '../model/report';
import {StudentEvent} from '../model/studentEvent';
import {ReportPayload} from '../components/report/report';
import {ReportResponse} from '../model/moderation';
import {KudosEntry} from '../model/profile';


@Injectable({
  providedIn: 'root',
})
export class ModerationService {
  private readonly http = inject(HttpClient);

  createReport(payload: ReportPayload): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`/api/moderation/report`, {
      targetId: payload.targetId,
      contextId: payload.contextId ?? null,
      channelType: payload.channelType,
      reportType: payload.type,
      message: payload.message,
    });
  }

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.url}/api/moderation/reports`);
  }

  resolveReport(reportId: string): Observable<{ status: string }> {
    return this.http.patch<{ status: string }>(
      `${this.url}/api/moderation/report/${reportId}/resolve`,
      {}
    );
  }

  getReportedEventById(eventId: string): Observable<StudentEvent> {
    return this.http.get<StudentEvent>(`${this.url}/api/events/${eventId}/reported`);
  }

  getKudoEntryById(id: string): Observable<KudosEntry> {
    return this.http.get<KudosEntry>(`${this.url}/api/profiles/kudos/${id}`);
  }

}
