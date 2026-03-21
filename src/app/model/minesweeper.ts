export interface MinesweeperSession {
  profileId: string;
  gameDate: string;
  revealedMap: CellState[][];
  flagMap: boolean[][];
  moveCount: number;
  solved: boolean;
  gameOver: boolean;
  solvedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SessionResponse extends MinesweeperSession {
  boardHints: number[][];
  mineLocations?: boolean[][];
}

export interface MoveResponse {
  session: MinesweeperSession;
  solved: boolean;
  gameOver: boolean;
  hitMine: boolean;
  kudosEarned: number;
  boardHints: number[][];
  mineLocations?: boolean[][];
}

export type CellState = 'hidden' | 'revealed';
export type MoveAction = 'reveal' | 'flag' | 'unflag' | 'chord';
export type GameState = 'loading' | 'playing' | 'won' | 'lost';

export const GRID_SIZE = 16;
export const MINE_COUNT = 40;
