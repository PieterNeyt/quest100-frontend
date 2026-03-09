import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { TranslationService } from '../services/translationService';
import { GotchaEndScreenComponent } from './gotcha-end-screen';

@Component({
  selector: 'app-gotcha-end-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, GotchaEndScreenComponent],
  providers: [provideIcons(lucideIcons)],
  template: `
    <div class="end-page-wrap">
      <div class="end-page-header">
        <button class="btn-back" (click)="goBack()">
          <ng-icon hlm name="lucideArrowLeft" size="sm" />
          {{ t.t('gotcha.page.back') }}
        </button>
        <div class="end-page-title-row">
          <span class="page-icon">🎯</span>
          <h1 class="page-title">Gotcha</h1>
          <span class="status-pill status-finished">
            {{ t.t('gotcha.status.finished') }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <div class="end-loading">
          <div class="end-load-spinner"></div>
          <p>{{ t.t('gotcha.endScreen.loading') }}</p>
        </div>
      } @else if (error()) {
        <div class="end-error">
          <ng-icon hlm name="lucideAlertCircle" size="48" />
          <p>{{ t.t('gotcha.endScreen.loadError') }}</p>
          <button class="btn-retry" (click)="load()">
            <ng-icon hlm name="lucideRefreshCw" size="sm" />
            {{ t.t('event.retry') }}
          </button>
        </div>
      } @else if (data()) {
        <app-gotcha-end-screen [data]="data()!" />
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .end-page-wrap { max-width: 720px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
    .end-page-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
    .btn-back { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.9rem; background: white; border: 2px solid #e5e7eb; border-radius: 10px; color: #6b7280; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s; }
    .btn-back:hover { border-color: #1cb0f6; color: #1cb0f6; }
    .end-page-title-row { display: flex; align-items: center; gap: 0.5rem; }
    .page-icon { font-size: 1.4rem; line-height: 1; }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1f2937; letter-spacing: -0.3px; }
    .status-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
    .status-finished { background: #f3f4f6; color: #6b7280; }
    .end-loading, .end-error { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 5rem 2rem; color: #9ca3af; text-align: center; }
    .end-load-spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #e5383b; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-retry { display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1.2rem; background: white; border: 2px solid #e5e7eb; border-radius: 10px; color: #374151; font-weight: 600; font-size: .88rem; cursor: pointer; font-family: inherit; transition: all .15s; }
    .btn-retry:hover { border-color: #1cb0f6; color: #1cb0f6; }
  `],
})
export class GotchaEndPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  loading = signal(true);
  error = signal(false);

  data = this.gotchaService.endScreen;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    this.gotchaService.getEndScreen().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/gotcha']);
  }
}
