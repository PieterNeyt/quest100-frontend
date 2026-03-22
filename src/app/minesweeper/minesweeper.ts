import {Component, computed, HostListener, inject, OnInit, signal,} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {MinesweeperService} from '../services/minesweeperService';
import {TranslationService} from '../services/translationService';
import {CellState, GameState, GRID_SIZE, MINE_COUNT, MoveAction,} from '../model/minesweeper';
import {buildEmptyFlags, buildEmptyHints, buildEmptyRevealed, countFlags} from '../utils/minesweeperUtils';

@Component({
  selector: 'app-minesweeper',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './minesweeper.html',
  styleUrl: './minesweeper.css',
})
export class MinesweeperPageComponent implements OnInit {
  private readonly minesweeperService = inject(MinesweeperService);
  readonly t = inject(TranslationService);
  private readonly location       = inject(Location);
  readonly MINE_COUNT = MINE_COUNT;
  readonly gridIndices = Array.from({ length: GRID_SIZE }, (_, i) => i);

  gameState = signal<GameState>('loading');
  revealedMap = signal<CellState[][]>(buildEmptyRevealed());
  flagMap = signal<boolean[][]>(buildEmptyFlags());
  boardHints = signal<number[][]>(buildEmptyHints());
  mineLocations = signal<boolean[][]>(buildEmptyFlags());

  errorMessage = signal<string | null>(null);
  showResultPopup = signal(false);
  kudosEarned = signal(0);
  showHowToPlay = signal(false);
  flagMode = signal(false);
  explodedCell = signal<{ row: number; col: number } | null>(null);

  flagCount = signal(0);
  minesLeft = computed(() => MINE_COUNT - this.flagCount());

  ngOnInit(): void {
    this.minesweeperService.getSession().subscribe({
      next: (session) => {
        if (session.revealedMap) {
          this.revealedMap.set(session.revealedMap.map((r) => [...r]));
        }
        if (session.flagMap) {
          this.flagMap.set(session.flagMap.map((r) => [...r]));
        }
        if (session.boardHints) {
          this.boardHints.set(session.boardHints.map((r) => [...r]));
        }
        if (session.mineLocations) {
          this.mineLocations.set(session.mineLocations.map((r) => [...r]));
        }
        this.flagCount.set(countFlags(session.flagMap));

        if (session.solved) {
          this.gameState.set('won');
          this.showResultPopup.set(true);
        } else if (session.gameOver) {
          this.gameState.set('lost');
          this.showResultPopup.set(true);
        } else {
          this.gameState.set('playing');
        }
      },
      error: () => {
        this.errorMessage.set(this.t.t('minesweeper.error.loadFailed'));
        this.gameState.set('playing');
      },
    });
  }
  goBack() {
    this.location.back();
  }
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'f' || event.key === 'F') {
      this.flagMode.update((v) => !v);
    }
  }

  onCellClick(row: number, col: number): void {
    if (this.gameState() !== 'playing') return;

    if (this.revealedMap()[row]?.[col] === 'revealed') {
      const hint = this.boardHints()[row]?.[col] ?? 0;
      if (hint > 0) {
        this.submitMove('chord', row, col);
      }
      return;
    }

    const action: MoveAction = this.flagMode()
      ? this.flagMap()[row][col] ? 'unflag' : 'flag'
      : 'reveal';
    this.submitMove(action, row, col);
  }

  onCellRightClick(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();
    if (this.gameState() !== 'playing') return;
    const action: MoveAction = this.flagMap()[row][col] ? 'unflag' : 'flag';
    this.submitMove(action, row, col);
  }

  private submitMove(action: MoveAction, row: number, col: number): void {
    this.minesweeperService.submitMove(action, row, col).subscribe({
      next: (resp) => {
        this.boardHints.set(resp.boardHints);

        if (resp.session.revealedMap) {
          this.revealedMap.set(resp.session.revealedMap.map((r) => [...r]));
        }
        if (resp.session.flagMap) {
          this.flagMap.set(resp.session.flagMap.map((r) => [...r]));
          this.flagCount.set(countFlags(resp.session.flagMap));
        }
        if (resp.mineLocations) {
          this.mineLocations.set(resp.mineLocations);
        }

        if (resp.hitMine) {
          this.explodedCell.set({ row, col });
          setTimeout(() => {
            this.gameState.set('lost');
            this.showResultPopup.set(true);
          }, 800);
        } else if (resp.solved) {
          setTimeout(() => {
            this.kudosEarned.set(resp.kudosEarned);
            this.gameState.set('won');
            this.showResultPopup.set(true);
          }, 400);
        }
      },
      error: (err) => {
        const msg = err?.error?.error ?? this.t.t('minesweeper.error.invalidMove');
        this.showError(msg);
      },
    });
  }

  getCellClass(row: number, col: number): Record<string, boolean> {
    const revealed = this.revealedMap()[row]?.[col] === 'revealed';
    const flagged = this.flagMap()[row]?.[col] ?? false;
    const hint = this.boardHints()[row]?.[col] ?? -1;
    const exploded = this.explodedCell()?.row === row && this.explodedCell()?.col === col;
    const isMine = this.mineLocations()[row]?.[col] ?? false;
    const gameEnded = this.gameState() === 'won' || this.gameState() === 'lost';
    return {
      'cell-hidden': !revealed && !exploded && !(gameEnded && isMine),
      'cell-revealed': revealed && !isMine,
      'cell-mine': isMine && gameEnded && !exploded,
      'cell-flagged': flagged && !isMine,
      'cell-exploded': exploded,
      [`hint-${hint}`]: revealed && hint >= 0 && !isMine,
    };
  }

  closePopup(): void {
    this.showResultPopup.set(false);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 2000);
  }
}
