import {CellState, GRID_SIZE} from '../model/sudoku';

export function buildEmptyBoard(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

export function buildEmptyCellStates(): CellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array<CellState>(GRID_SIZE).fill('empty')
  );
}

export function buildEmptyConflicts(): boolean[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
}
