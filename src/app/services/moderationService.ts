import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { ReportPayload } from '../report/report';
import {Report} from '../model/report';
import {StudentEvent} from '../model/studentEvent';

export interface ReportResponse {
  id: string;
  targetId: string;
  contextId?: string;
  channelType: number;
  reportType: number;
  message: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModerationService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiConfig.uri;

  createReport(payload: ReportPayload): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.url}/api/moderation/report`, {
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

}
