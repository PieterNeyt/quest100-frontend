import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MsalService} from '@azure/msal-angular';
import {environment} from '../../../environment/environment';
import {TranslationService} from './translationService';
import {Observable} from 'rxjs';
import {StudentEvent} from '../model/studentEvent';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly url = environment.apiConfig.uri;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(MsalService);
  private readonly translationService = inject(TranslationService);

  getAllEvents(): Observable<StudentEvent[]> {
    return this.http.get<StudentEvent[]>(`${this.url}/api/events`);
  }

  getEventById(eventId: string): Observable<StudentEvent> {
    return this.http.get<StudentEvent>(`${this.url}/api/events/${eventId}`);
  }

  createEvent(event: StudentEvent): Observable<StudentEvent> {
    return this.http.post<StudentEvent>(`${this.url}/api/events`, event);
  }

  updateEvent(eventId: string, event: StudentEvent): Observable<StudentEvent> {
    return this.http.put<StudentEvent>(`${this.url}/api/events/${eventId}`, event);
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/api/events/${eventId}`);
  }

  joinEvent(eventId: string): Observable<void> {
    return this.http.post<void>(`${this.url}/api/events/${eventId}/attendance`, {});
  }

  cancelEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/api/events/${eventId}/attendance`);
  }
}
