export interface Prize {
  Name: string;
  Description: string;
  PhotoURL: string;
}

export interface LeaderboardClass {
  LeaderboardId: string;
  ClassId:       string;
  ClassName?:    string;
  TotalKudos:    number;
}

export interface Leaderboard {
  Id:        string;
  CourseId:  string;
  StartDate: string;
  EndDate:   string;
  Prize:     Prize;
  Classes:   LeaderboardClass[];
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
