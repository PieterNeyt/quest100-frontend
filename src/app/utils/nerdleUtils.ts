import {WritableSignal} from '@angular/core';
import {GuessRow, MAX_ATTEMPTS, TileColor} from '../model/nerdle';

export function buildEmptyRows(length: number): GuessRow[] {
  return Array.from({length: MAX_ATTEMPTS}, () => ({
    chars: Array(length).fill(''),
    results: [],
    submitted: false,
  }));
}

export function colorPriority(color: TileColor): number {
  const p: Record<TileColor, number> = {correct: 3, present: 2, absent: 1, empty: 0};
  return p[color];
}

export function triggerSignal(sig: WritableSignal<number | null>, value: number, duration: number): void {
  sig.set(value);
  setTimeout(() => sig.set(null), duration);
}
