import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environment/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private url = environment.apiConfig.uri;
  private http = inject(HttpClient);

  // TODO zorgen dat reponse van backend gelijk is aan degene dat hier verwacht wordt (mogelijks werken met een pipe en map)
  getAllChatsOfChatRoom(roomId: string) {
    return this.http.get<ChatMessage[]>(`${this.url}/api/chat/${roomId}`);
  }
}
