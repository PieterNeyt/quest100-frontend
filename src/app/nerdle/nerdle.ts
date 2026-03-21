import {Component, computed, HostListener, inject, OnInit, signal,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {NerdleService} from '../services/nerdleService';
import {TranslationService} from '../services/translationService';
import {
  DEFAULT_EQUATION_LENGTH,
  GameState,
  GuessRow,
  KeyColorMap,
  MAX_ATTEMPTS,
  NerdleAttempt,
  TileColor,
} from '../model/nerdle';

@Component({
  selector: 'app-nerdle',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './nerdle.html',
  styleUrl: './nerdle.css',
})
export class NerdlePageComponent implements OnInit {
  private readonly nerdleService = inject(NerdleService);
  readonly t = inject(TranslationService);

  equationLength = signal(DEFAULT_EQUATION_LENGTH);
  gameState = signal<GameState>('loading');
  rows = signal<GuessRow[]>(this.buildEmptyRows(DEFAULT_EQUATION_LENGTH));
  currentRow = signal(0);
  currentCol = signal(0);
  errorMessage = signal<string | null>(null);
  shakeRow = signal<number | null>(null);
  flipRow = signal<number | null>(null);
  selectedCol = signal<number | null>(null);

  showResultPopup = signal(false);
  kudosEarned = signal(0);
  showHowToPlay = signal(false);

  keyColors = computed<KeyColorMap>(() => {
    const map: KeyColorMap = {};
    for (const row of this.rows()) {
      if (!row.submitted) continue;
      for (const result of row.results) {
        const existing = map[result.char];
        if (!existing || this.colorPriority(result.status) > this.colorPriority(existing)) {
          map[result.char] = result.status;
        }
      }
    }
    return map;
  });

  ngOnInit(): void {
    this.nerdleService.getSession().subscribe({
      next: (session) => {
        if (session.attempts.length > 0) {
          const length = session.attempts[0].guess.length;
          this.equationLength.set(length);
          this.rows.set(this.buildEmptyRows(length));

          this.rows.update((rows) => {
            const updated = rows.map((r) => ({ ...r, chars: [...r.chars], results: [...r.results] }));
            session.attempts.forEach((attempt, i) => {
              if (i >= MAX_ATTEMPTS) return;
              updated[i].chars = attempt.guess.split('');
              updated[i].results = attempt.result;
              updated[i].submitted = true;
            });
            return updated;
          });

          this.currentRow.set(Math.min(session.attempts.length, MAX_ATTEMPTS - 1));
          this.currentCol.set(0);
        }

        if (session.solved) {
          this.gameState.set('won');
          this.showResultPopup.set(true);
        } else if (session.attempts.length >= MAX_ATTEMPTS) {
          this.gameState.set('lost');
          this.showResultPopup.set(true);
        } else {
          this.gameState.set('playing');
        }
      },
      error: () => {
        this.errorMessage.set(this.t.t('nerdle.error.loadFailed'));
        this.gameState.set('playing');
      },
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.gameState() !== 'playing') return;
    const key = event.key;
    if ('0123456789+-*/='.includes(key) && key.length === 1) {
      this.pressKey(key);
    } else if (key === 'Backspace') {
      this.pressDelete();
    } else if (key === 'Enter') {
      this.pressEnter();
    }
  }

  clickTile(rowIndex: number, colIndex: number): void {
    if (this.gameState() !== 'playing') return;
    if (rowIndex !== this.currentRow()) return;
    this.selectedCol.set(colIndex);
    this.currentCol.set(colIndex);
  }

  pressKey(key: string): void {
    if (this.gameState() !== 'playing') return;
    const col = this.currentCol();
    const length = this.equationLength();
    if (col >= length) return;

    this.rows.update((rows) => {
      const updated = rows.map((r) => ({ ...r, chars: [...r.chars] }));
      updated[this.currentRow()].chars[col] = key;
      return updated;
    });

    const chars = this.rows()[this.currentRow()].chars;
    const nextEmpty = chars.findIndex((c, i) => i > col && c === '');
    if (nextEmpty !== -1) {
      this.currentCol.set(nextEmpty);
    } else {
      this.currentCol.set(Math.min(col + 1, length - 1));
    }
    this.selectedCol.set(null);
    this.errorMessage.set(null);
  }

  pressDelete(): void {
    if (this.gameState() !== 'playing') return;
    const col = this.currentCol();

    this.rows.update((rows) => {
      const updated = rows.map((r) => ({ ...r, chars: [...r.chars] }));
      updated[this.currentRow()].chars[col] = '';
      return updated;
    });

    if (col > 0) {
      this.currentCol.set(col - 1);
    }
    this.selectedCol.set(null);
    this.errorMessage.set(null);
  }

  pressEnter(): void {
    if (this.gameState() !== 'playing') return;
    const row = this.currentRow();
    const chars = this.rows()[row].chars;
    const guess = chars.join('');

    if (chars.some((c) => c === '')) {
      this.showError(this.t.t('nerdle.error.tooShort'));
      this.triggerShake(row);
      return;
    }

    this.nerdleService.submitGuess(guess).subscribe({
      next: (resp) => {
        this.applyAttempt(row, resp.attempt, resp.solved, resp.gameOver, resp.kudosEarned);
      },
      error: (err) => {
        const msg = err?.error?.error ?? this.t.t('nerdle.error.invalidEquation');
        this.showError(msg);
        this.triggerShake(row);
      },
    });
  }

  private applyAttempt(
    row: number,
    attempt: NerdleAttempt,
    solved: boolean,
    gameOver: boolean,
    kudosEarned: number,
  ): void {
    if (attempt.result.length !== this.equationLength()) {
      this.equationLength.set(attempt.result.length);
    }

    this.rows.update((rows) => {
      return rows.map((r, i) => {
        if (i !== row) return r;
        return {
          ...r,
          chars: attempt.guess.split(''),
          results: attempt.result,
          submitted: true,
        };
      });
    });

    this.triggerFlip(row);

    if (solved) {
      setTimeout(() => {
        this.kudosEarned.set(kudosEarned);
        this.gameState.set('won');
        this.showResultPopup.set(true);
      }, row * 80 + 500);
    } else if (gameOver) {
      setTimeout(() => {
        this.gameState.set('lost');
        this.showResultPopup.set(true);
      }, row * 80 + 500);
    } else {
      this.currentRow.update((r) => r + 1);
      this.currentCol.set(0);
      this.selectedCol.set(null);
    }
  }

  closePopup(): void {
    this.showResultPopup.set(false);
  }

  private buildEmptyRows(length: number): GuessRow[] {
    return Array.from({ length: MAX_ATTEMPTS }, () => ({
      chars: Array(length).fill(''),
      results: [],
      submitted: false,
    }));
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 2000);
  }

  private triggerShake(row: number): void {
    this.shakeRow.set(row);
    setTimeout(() => this.shakeRow.set(null), 600);
  }

  private triggerFlip(row: number): void {
    this.flipRow.set(row);
    setTimeout(() => this.flipRow.set(null), 500);
  }

  getTileColor(rowIndex: number, colIndex: number): TileColor {
    const row = this.rows()[rowIndex];
    if (!row?.submitted || !row.results[colIndex]) return 'empty';
    return row.results[colIndex].status;
  }

  getTileChar(rowIndex: number, colIndex: number): string {
    return this.rows()[rowIndex]?.chars[colIndex] ?? '';
  }

  isCurrentTile(rowIndex: number, colIndex: number): boolean {
    return (
      this.gameState() === 'playing' &&
      rowIndex === this.currentRow() &&
      colIndex === this.currentCol()
    );
  }

  isClickableRow(rowIndex: number): boolean {
    return this.gameState() === 'playing' && rowIndex === this.currentRow();
  }

  getKeyColor(key: string): TileColor {
    return this.keyColors()[key] ?? 'empty';
  }

  private colorPriority(color: TileColor): number {
    const p: Record<TileColor, number> = { correct: 3, present: 2, absent: 1, empty: 0 };
    return p[color];
  }
}
