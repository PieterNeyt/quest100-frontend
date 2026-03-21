export interface GameStatus {
  gameId: string;
  date: string;
  hasSession: boolean;
  solved: boolean;
  attemptsUsed: number;
  attemptsLeft: number;
  maxAttempts: number;
  completedAt?: string;
}

export interface NerdleSession {
  id: string;
  gameId: string;
  profileId: string;
  attempts: NerdleAttempt[];
  solved: boolean;
  solvedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface NerdleAttempt {
  id: string;
  sessionId: string;
  guess: string;
  result: TileResult[];
  createdAt: string;
}

export interface TileResult {
  char: string;
  status: 'correct' | 'present' | 'absent';
}
export interface GuessResponse {
  attempt: NerdleAttempt;
  session: NerdleSession;
  solved: boolean;
  gameOver: boolean;
  attemptsLeft: number;
  kudosEarned: number;
}

export type TileColor = 'correct' | 'present' | 'absent' | 'empty';
export type GameState = 'loading' | 'playing' | 'won' | 'lost';

export interface GuessRow {
  chars: string[];
  results: TileResult[];
  submitted: boolean;
}

export type KeyColorMap = Record<string, TileColor>;

export const MAX_ATTEMPTS = 6;
export const DEFAULT_EQUATION_LENGTH = 8;
