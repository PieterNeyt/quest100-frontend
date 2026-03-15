import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { WebsocketService } from '../../services/websocketService';
import { ProfileService } from '../../services/profileService';
import { Subscription } from 'rxjs';
import { NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chatService';
import { ReceiveMessage, SendMessage } from '../../model/chat';
import { NgIcon } from '@ng-icons/core';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import {ReportComponent} from '../report/report';

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule,
    NgClass,
    NgIcon,
    HlmIconImports,
    ReportComponent,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private socketService = inject(WebsocketService);
  private profile = inject(ProfileService).profile;
  private subscription?: Subscription;
  private chatService = inject(ChatService);

  chatLog = signal<ReceiveMessage[]>([]);
  currentInput = '';
  currentUser = this.profile()?.id || "";
  reportingMessage = signal<ReceiveMessage | null>(null);
  chatId = signal<string>('');

  constructor() {
    effect(() => {
      if (this.socketService.isConnected()) {
        const eventId = this.route.snapshot.paramMap.get('eventId');
        if (eventId !== null) {
          const payload: SendMessage = {
            type: "join",
            senderId: "",
            roomId: eventId,
            content: ""
          };
          this.socketService.send(payload);
        }
      }
    });
  }

  ngOnInit() {
    this.socketService.connect();
    this.subscription = this.socketService.messages$.subscribe({
      next: rawMsg => {
        const msg: ReceiveMessage = JSON.parse(rawMsg);
        this.chatLog.update(prev => [...prev, msg]);
      }
    });
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (eventId !== null) {
      this.chatId.set(eventId);
      this.chatService.getAllChatsOfChatRoom(eventId).subscribe({
        next: msg => {
          this.chatLog.update(prev => [...prev, ...msg]);
        }
      });
    }
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.subscription?.unsubscribe();
  }

  send() {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (this.currentInput.trim() && eventId !== null) {
      const payload: SendMessage = {
        type: 'group',
        senderId: "",
        roomId: eventId,
        content: this.currentInput,
      };
      this.socketService.send(payload);
      this.currentInput = '';
    }
  }

  openReportModal(message: ReceiveMessage) {
    this.reportingMessage.set(message);
  }

  closeReportModal() {
    this.reportingMessage.set(null);
  }
}
