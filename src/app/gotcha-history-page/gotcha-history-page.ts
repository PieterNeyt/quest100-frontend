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
import { GotchaService, GameSummary } from '../services/gotchaService';
import { TranslationService } from '../services/translationService';
import { Location } from '@angular/common';
@Component({
  selector: 'app-gotcha-history-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-history-page.html',
  styleUrl: './gotcha-history-page.css',
})
export class GotchaHistoryPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly router        = inject(Router);
  private readonly location = inject(Location);
  readonly t = inject(TranslationService);

  loading = signal(true);
  error   = signal(false);
  games   = signal<GameSummary[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.gotchaService.getGameHistory().subscribe({
      next:  (data) => { this.games.set(data); this.loading.set(false); },
      error: ()     => { this.error.set(true);  this.loading.set(false); },
    });
  }

  viewGame(game: GameSummary) {
    this.router.navigate(['/gotcha/end', game.id]);
  }

  goBack() {
    this.location.back();
  }

  winnerName(game: GameSummary): string {
    if (!game.winner) return '—';
    return `${game.winner.firstName} ${game.winner.lastName}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
