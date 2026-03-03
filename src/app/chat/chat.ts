import {Component, inject, OnInit, signal} from '@angular/core';
import {Websocket} from '../services/websocket';
import {FormsModule} from '@angular/forms';
import {ProfileService} from '../services/profileService';
import {NgClass} from '@angular/common';

interface ChatMessage {
  type: 'private' | 'group';
  senderId: string;
  recipientId?: string; // Used if type is 'private'
  roomId?: string;      // Used if type is 'group'
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
export class Chat implements OnInit {
  private socketService = inject(Websocket);
  private profile = inject(ProfileService).profile;

  // Use a proper type for the signal
  chatLog = signal<ChatMessage[]>([]);
  currentInput = '';
  currentUser = this.profile()?.id || "";

  ngOnInit() {
    this.socketService.messages$.subscribe(rawMsg => {
      // Parse the incoming JSON message
      const msg: ChatMessage = JSON.parse(rawMsg);
      this.chatLog.update(prev => [...prev, msg]);
    });
  }

  send() {
    if (this.currentInput.trim()) {
      // Now we need to send JSON, not raw text
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
