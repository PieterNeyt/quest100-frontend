import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { TranslationService } from '../services/translationService';
import { GotchaEndScreenComponent } from '../components/gotcha-end-screen/gotcha-end-screen';
import { EndScreen } from '../model/gotcha';

@Component({
  selector: 'app-gotcha-end-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, GotchaEndScreenComponent],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-end-page.html',
  styleUrl:    './gotcha-end-page.css',
})
export class GotchaEndPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  readonly t = inject(TranslationService);

  loading = signal(true);
  error   = signal(false);

  private gameId: string | null = null;

  sharedData  = this.gotchaService.endScreen;
  localData   = signal<EndScreen | null>(null);

  data = () => this.gameId ? this.localData() : this.sharedData();

  isHistoryView = () => !!this.gameId;

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    const obs = this.gameId
      ? this.gotchaService.getEndScreenById(this.gameId)
      : this.gotchaService.getEndScreen();

    obs.subscribe({
      next: (data) => {
        if (this.gameId) {
          this.localData.set(data);
        }
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  goBack() {
    this.router.navigate(['/event']);
  }

  goToHistory() {
    this.router.navigate(['/gotcha/history']);
  }
}
