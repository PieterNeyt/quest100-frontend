import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../services/chatService';
import { ModerationService } from '../../services/moderationService';
import { ReceiveMessage } from '../../model/chat';
import { Report } from '../../model/report';

@Component({
  selector: 'app-report-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-chat.html',
  styleUrl: './report-chat.css',
})
export class reportChat implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chatService = inject(ChatService);
  private readonly moderationService = inject(ModerationService);

  @ViewChild('chatBody') chatBodyRef!: ElementRef<HTMLDivElement>;

  reportId!: string;
  messageId!: string;
  chatId!: string;

  messages = signal<ReceiveMessage[]>([]);
  report = signal<Report | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showResolveModal = signal(false);
  resolving = signal(false);

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('reportId')!;
    this.messageId = this.route.snapshot.paramMap.get('messageId')!;
    this.chatId = this.route.snapshot.paramMap.get('chatId')!;

    if (!this.reportId) {
      this.router.navigate(['/report/dashboard']);
      return;
    }

    this.loadData();
  }

  ngAfterViewInit(): void {}

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Chat is the only thing that drives loading state
    this.chatService.getAllChatsOfChatRoom(this.chatId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loading.set(false);
        setTimeout(() => this.scrollToHighlighted(), 50);
      },
      error: () => {
        this.error.set('Failed to load chat messages.');
        this.loading.set(false);
      },
    });

    // Report banner loads independently — non-blocking
    this.moderationService.getReports().subscribe({
      next: (reports) => {
        const found = reports.find(r => r.id === this.reportId) ?? null;
        this.report.set(found);
      },
      error: () => {
        // Non-fatal, banner just won't show
      },
    });
  }

  scrollToHighlighted(): void {
    const el = document.getElementById(`msg-${this.messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  resolve(): void {
    if (this.resolving()) return;
    this.resolving.set(true);
    this.moderationService.resolveReport(this.reportId).subscribe({
      next: () => {
        this.report.update(r => r ? { ...r, resolved: true } : r);
        this.resolving.set(false);
        this.showResolveModal.set(false);
      },
      error: () => {
        this.resolving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reports/dashboard']);
  }

  initials(sender: ReceiveMessage['sender']): string {
    if (!sender) return '?';
    return ((sender.firstName?.[0] ?? '') + (sender.lastName?.[0] ?? '')).toUpperCase() || '?';
  }
}
