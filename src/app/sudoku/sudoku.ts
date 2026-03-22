import {Component, computed, HostListener, inject, OnInit, signal,} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {SudokuService} from '../services/sudokuService';
import {TranslationService} from '../services/translationService';
import {CellState, GameState, GRID_SIZE, SessionResponse,} from '../model/sudoku';
import {buildEmptyBoard, buildEmptyCellStates, buildEmptyConflicts} from '../utils/sudokuUtils';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './sudoku.html',
  styleUrl: './sudoku.css',
})
export class SudokuPageComponent implements OnInit {
  private readonly sudokuService = inject(SudokuService);
  readonly t = inject(TranslationService);
  private readonly location       = inject(Location);
  readonly gridIndices = Array.from({ length: GRID_SIZE }, (_, i) => i);

  gameState = signal<GameState>('loading');
  playerBoard = signal<number[][]>(buildEmptyBoard());
  private cellStates = signal<CellState[][]>(buildEmptyCellStates());
  private conflictMap = signal<boolean[][]>(buildEmptyConflicts());

  private selectedCell = signal<{ row: number; col: number } | null>(null);
  errorMessage = signal<string | null>(null);
  showResultPopup = signal(false);
  kudosEarned = signal(0);
  showHowToPlay = signal(false);

  conflictCount = computed(() => {
    let count = 0;
    this.conflictMap().forEach(row => row.forEach(c => { if (c) count++; }));
    return count;
  });

  moveCount = signal(0);

  ngOnInit(): void {
    this.sudokuService.getSession().subscribe({
      next: (session) => this.applySession(session),
      error: () => {
        this.errorMessage.set(this.t.t('sudoku.error.loadFailed'));
        this.gameState.set('playing');
      },
    });
  }

  goBack() {
    this.location.back();
  }

  private applySession(session: SessionResponse): void {
    this.playerBoard.set(session.playerBoard.map(r => [...r]));
    this.cellStates.set(session.cellStates.map(r => [...r]));
    this.conflictMap.set(session.conflictMap.map(r => [...r]));
    this.moveCount.set(session.moveCount);

    if (session.solved) {
      this.gameState.set('won');
      this.showResultPopup.set(true);
    } else {
      this.gameState.set('playing');
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const cell = this.selectedCell();
    if (!cell || this.gameState() !== 'playing') return;

    const { row, col } = cell;
    if (this.cellStates()[row][col] === 'given') return;

    if (event.key >= '1' && event.key <= '9') {
      this.submitMove(row, col, parseInt(event.key, 10));
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      this.submitMove(row, col, 0);
      return;
    }

    // Arrow key navigation
    const moves: Record<string, [number, number]> = {
      ArrowUp:    [-1,  0],
      ArrowDown:  [ 1,  0],
      ArrowLeft:  [ 0, -1],
      ArrowRight: [ 0,  1],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dr, dc] = moves[event.key];
      const nr = Math.max(0, Math.min(GRID_SIZE - 1, row + dr));
      const nc = Math.max(0, Math.min(GRID_SIZE - 1, col + dc));
      this.selectedCell.set({ row: nr, col: nc });
    }
  }

  onCellClick(row: number, col: number): void {
    if (this.gameState() !== 'playing') return;
    const current = this.selectedCell();
    if (current?.row === row && current?.col === col) {
      this.selectedCell.set(null);
    } else {
      this.selectedCell.set({ row, col });
    }
  }

  onDigitPad(value: number): void {
    const cell = this.selectedCell();
    if (!cell || this.gameState() !== 'playing') return;
    if (this.cellStates()[cell.row][cell.col] === 'given') return;
    this.submitMove(cell.row, cell.col, value);
  }

  private submitMove(row: number, col: number, value: number): void {
    this.sudokuService.submitMove(row, col, value).subscribe({
      next: (resp) => {
        this.playerBoard.set(resp.session.playerBoard.map(r => [...r]));
        this.cellStates.set(resp.session.cellStates.map(r => [...r]));
        this.conflictMap.set(resp.conflictMap.map(r => [...r]));
        this.moveCount.set(resp.session.moveCount);

        if (resp.solved) {
          setTimeout(() => {
            this.kudosEarned.set(resp.kudosEarned);
            this.gameState.set('won');
            this.showResultPopup.set(true);
          }, 300);
        }
      },
      error: (err) => {
        const msg = err?.error?.error ?? this.t.t('sudoku.error.invalidMove');
        this.showError(msg);
      },
    });
  }

  getCellClass(row: number, col: number): Record<string, boolean> {
    const state   = this.cellStates()[row]?.[col] ?? 'empty';
    const value   = this.playerBoard()[row]?.[col] ?? 0;
    const sel     = this.selectedCell();
    const isSel   = sel?.row === row && sel?.col === col;
    const conflict = this.conflictMap()[row]?.[col] ?? false;

    const selValue = sel ? (this.playerBoard()[sel.row]?.[sel.col] ?? 0) : 0;
    const isSameValue = !isSel && value !== 0 && selValue !== 0 && value === selValue;

    const isPeer =
      sel !== null && !isSel &&
      (sel.row === row ||
        sel.col === col ||
        (Math.floor(sel.row / 3) === Math.floor(row / 3) &&
          Math.floor(sel.col / 3) === Math.floor(col / 3)));

    return {
      'cell-given':      state === 'given',
      'cell-empty':      state === 'empty',
      'cell-filled':     state === 'filled' && !conflict,
      'cell-selected':   isSel,
      'cell-conflict':   conflict && !isSel,
      'cell-same-value': isSameValue && !conflict,
      'cell-peer-given': isPeer && !isSameValue && state === 'given',
      'cell-peer':       isPeer && !isSameValue && state !== 'given',
    };
  }

  isBoxBorderRight(col: number): boolean {
    return col === 2 || col === 5;
  }

  isBoxBorderBottom(row: number): boolean {
    return row === 2 || row === 5;
  }

  closePopup(): void {
    this.showResultPopup.set(false);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 2000);
  }
}
