import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environment/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private url = environment.apiConfig.uri;
  private http = inject(HttpClient);

  getAllChatsOfChatRoom(roomId: string) {
    return this.http.get<ReceiveMessage[]>(`${this.url}/api/chat/${roomId}`);
  }
}
