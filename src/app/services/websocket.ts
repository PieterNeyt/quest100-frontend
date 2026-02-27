import {Injectable, signal} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Websocket {
  // private url = "ws://localhost:8080";
  // private subject: WebSocket | undefined;
  //
  // listen() {
  //   if (this.subject) return;
  //   this.subject = new WebSocket(this.url);
  //   this.subject.onopen = function () {
  //     console.log("Websocket opened");
  //     // send("Hello from angular");
  //   }
  //   this.subject.onclose = function () {
  //     console.log("Websocket closed");
  //   }
  //   this.subject.onmessage = function (event) {
  //     console.log("Websocket message", event.data);
  //   }
  //   this.subject.onerror = function (event) {
  //     console.log("Websocket error", event);
  //   }
  // }
  //
  // send(msg: string) {
  //   if (!this.subject) return;
  //
  //   this.subject.send(msg);
  // }

  private socket?: WebSocket;
  private messageSubject = new Subject<string>();

  // Expose messages as an Observable
  public messages$ = this.messageSubject.asObservable();

  // Connection status signal for the UI
  public isConnected = signal(false);

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket) return;
    this.socket = new WebSocket('ws://localhost:8080/ws');

    this.socket.onopen = () => this.isConnected.set(true);

    this.socket.onmessage = (event) => {
      this.messageSubject.next(event.data);
    };

    this.socket.onclose = () => {
      this.isConnected.set(false);
      // Simple exponential backoff or static retry
      setTimeout(() => this.connect(), 2000);
    };
  }

  send(msg: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
    }
  }
}
