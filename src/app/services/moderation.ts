import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { ReportPayload } from '../report/report';

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
}
