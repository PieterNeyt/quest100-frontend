import {CellState, GRID_SIZE} from '../model/minesweeper';

export function buildEmptyRevealed(): CellState[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('hidden'));
}

export function buildEmptyFlags(): boolean[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
}

export function buildEmptyHints(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(-1));
}

export function countFlags(flagMap: boolean[][]): number {
  let count = 0;
  flagMap.forEach(row => row.forEach(f => { if (f) count++; }));
  return count;
}
