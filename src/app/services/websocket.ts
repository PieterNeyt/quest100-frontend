import {effect, inject, Injectable, signal} from '@angular/core';
import {Subject} from 'rxjs';
import {ProfileService} from './profileService';

@Injectable({
  providedIn: 'root',
})
export class Websocket {
  private socket?: WebSocket;
  private messageSubject = new Subject<string>();
  private profile = inject(ProfileService).profile;
  private profileId = signal("");

  public messages$ = this.messageSubject.asObservable();
  public isConnected = signal(false);

  constructor() {
    effect(() => {
      const currentProfile = this.profile();

      if (currentProfile?.id && !this.socket) {
        this.profileId.set(currentProfile.id)
        this.connect();
      }
    });
  }

  private connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;
    this.socket = new WebSocket(`ws://localhost:8080/ws?token=${this.profileId()}`);

    this.socket.onopen = () => {
      console.log('Connection opened');
      this.isConnected.set(true)
    };

    this.socket.onmessage = (event) => {
      this.messageSubject.next(event.data);
    };

    this.socket.onclose = () => {
      this.isConnected.set(false);
      // Simple exponential backoff or static retry
      setTimeout(() => this.connect(), 2000);
    };
  }

  send(msg: ChatMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      msg.senderId = this.profileId();
      this.socket.send(JSON.stringify(msg));
    }
  }

  ngOnDestroy() {
    console.log('Connection disconnected');
    this.socket?.close();
  }
}
