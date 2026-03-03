import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ProfileService} from '../services/profileService';
import {NgClass} from '@angular/common';
import {Subscription} from 'rxjs';
import {WebsocketService} from '../services/websocketService';

interface ChatMessage {
  type: 'private' | 'group';
  senderId: string;
  recipientId?: string;
  roomId?: string;
  text: string;
}

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule,
    NgClass
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  private socketService = inject(WebsocketService);
  private profile = inject(ProfileService).profile;
  private subscription?: Subscription;

  chatLog = signal<ChatMessage[]>([]);
  currentInput = '';
  currentUser = this.profile()?.id || "";

  ngOnInit() {
    this.socketService.connect()
    this.subscription = this.socketService.messages$.subscribe(rawMsg => {

      const msg: ChatMessage = JSON.parse(rawMsg);
      this.chatLog.update(prev => [...prev, msg]);
    });
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.subscription?.unsubscribe();
  }

  send() {
    if (this.currentInput.trim()) {

      const payload: ChatMessage = {
        type: 'private',
        senderId: "",
        recipientId: "d1392c2a-445b-4bd2-8935-20bbe9882de2",
        text: this.currentInput,
      };

      this.socketService.send(payload);
      this.currentInput = '';
    }
  }
}
