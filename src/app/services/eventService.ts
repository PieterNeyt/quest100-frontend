import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StudentEvent} from '../model/studentEvent';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly http = inject(HttpClient);


  getAllEvents(): Observable<StudentEvent[]> {
    return this.http.get<StudentEvent[]>(`/api/events`);
  }

  getEventById(eventId: string): Observable<StudentEvent> {
    return this.http.get<StudentEvent>(`/api/events/${eventId}`);
  }

  createEvent(event: StudentEvent): Observable<StudentEvent> {
    return this.http.post<StudentEvent>(`/api/events`, event);
  }

  updateEvent(eventId: string, event: StudentEvent): Observable<StudentEvent> {
    return this.http.put<StudentEvent>(`/api/events/${eventId}`, event);
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`/api/events/${eventId}`);
  }

  joinEvent(eventId: string): Observable<void> {
    return this.http.post<void>(`/api/events/${eventId}/attendance`, {});
  }

  cancelEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`/api/events/${eventId}/attendance`);
  }
}
