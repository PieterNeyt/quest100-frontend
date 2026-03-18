export interface Prize {
  name: string;
  description: string;
  photoUrl: string;
}

export interface Leaderboard {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
  prize: Prize;
  classes: LeaderboardClass[];
}

export interface LeaderboardClass {
  leaderboardId: string;
  classId: string;
  totalKudos: number;
}
export interface PrizeRequest {
  name: string;
  description: string;
  photoUrl: string;
}

export interface CreateLeaderboardRequest {
  courseId: string;
  startDate: string;
  endDate: string;
  prize: PrizeRequest;
}

export interface UpdateLeaderboardRequest {
  startDate?: string;
  endDate?: string;
  prize?: PrizeRequest;
}
