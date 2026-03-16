import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ReceiveMessage} from '../model/chat';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);

  getAllChatsOfChatRoom(roomId: string) {
    return this.http.get<ReceiveMessage[]>(`/api/chat/${roomId}`);
  }
}
