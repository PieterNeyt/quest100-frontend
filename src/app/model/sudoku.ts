export interface SudokuSession {
  profileId: string;
  gameDate: string;
  puzzle: number[][];
  playerBoard: number[][];
  cellStates: CellState[][];
  moveCount: number;
  solved: boolean;
  solvedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SessionResponse extends SudokuSession {
  conflictMap: boolean[][];
}

export interface MoveResponse {
  session: SudokuSession;
  solved: boolean;
  kudosEarned: number;
  conflictMap: boolean[][];
}

export type CellState = 'given' | 'empty' | 'filled';
export type GameState = 'loading' | 'playing' | 'won';

export const GRID_SIZE = 9;
