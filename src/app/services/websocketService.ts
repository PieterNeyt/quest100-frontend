import {inject, Injectable, signal} from '@angular/core';
import {Subject} from 'rxjs';
import {ProfileService} from './profileService';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket?: WebSocket;
  private messageSubject = new Subject<string>();
  private profile = inject(ProfileService).profile;

  public messages$ = this.messageSubject.asObservable();
  public isConnected = signal(false);

  connect() {
    const currentProfile = this.profile();
    if (!currentProfile?.id) {
      console.warn('Cannot connect: No profile ID found.');
      return;
    }
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;
    this.socket = new WebSocket(`ws://localhost:8080/ws?token=${currentProfile.id}`);

    this.socket.onopen = () => {
      console.log('Connection opened');
      this.isConnected.set(true)
    };

    this.socket.onmessage = (event) => {
      this.messageSubject.next(event.data);
    };

    this.socket.onclose = () => {
      if (!this.isConnected()) return;
      this.isConnected.set(false);
      setTimeout(() => this.connect(), 2000);
    };
  }

  send(msg: ChatMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      msg.senderId = this.profile()?.id || "";
      this.socket.send(JSON.stringify(msg));
    }
  }

  disconnect() {
    if (this.socket) {
      this.isConnected.set(false)
      this.socket.close();
      console.log('Connection disconnected');
    }
  }
}
