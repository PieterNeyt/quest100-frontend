import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GotchaStateService {
  readonly activeTab = signal<'rules' | 'feed' | 'review'>('rules');
}
