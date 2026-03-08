export interface GotchaGame {
  id: string;
  campus: string;
  status: 'OPT_IN' | 'ACTIVE' | 'FINISHED';
  startDate: string | null;
  killDeadlineHours: number;
  winnerId?: string | null;
  createdAt: string;
  updatedAt: string;
  prizePhotoBase64?: string;
  prizeDescriptionEN?: string;
  prizeDescriptionNL?: string;
}

export interface GotchaParticipant {
  id: string;
  gameId: string;
  profileId: string;
  targetId?: string | null;
  isAlive: boolean;
  killDeadline: string;
  killedAt?: string | null;
  killedBy?: string | null;
  optedInAt: string;
  assignedPropId?: string | null;
}

export interface UpdateGameRequest {
  startDate: string;
  killDeadlineHours: number;
  prizePhotoBase64?: string;
  prizeDescriptionEN?: string;
  prizeDescriptionNL?: string;
}

// Keep old alias for compatibility
export type UpdateStartDateRequest = UpdateGameRequest;

export interface KillFeedProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
}

/** Both language variants are returned; pick at render time based on user preference. */
export interface KillFeedProp {
  id: string;
  nameEN: string;
  nameNL: string;
}

export interface KillFeedItem {
  id: string;
  gameId: string;
  photoBase64: string;      // ← was photoUrl, now base64
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
  reviewedAt?: string | null;

  hunter: KillFeedProfile;
  victim: KillFeedProfile;
  prop?: KillFeedProp | null;
  likeCount: number;
  likedByMe: boolean;
}

export interface TargetInfo {
  target?: KillFeedProfile | null;
  assignedProp?: KillFeedProp | null;
  killDeadline?: string | null;
}

export interface EndScreenKillNode {
  killId: string;
  hunter: KillFeedProfile;
  victim: KillFeedProfile;
  prop?: KillFeedProp | null;
  photoBase64: string;      // ← was photoUrl, now base64
  createdAt: string;
}

export interface EndScreenStats {
  totalKills: number;
  totalParticipants: number;
  fastestKillSecs: number;
  mostKillsName: string;
  mostKillsCount: number;
}

export interface EndScreen {
  winner?: KillFeedProfile | null;
  winnerKillCount: number;
  prizePhotoBase64?: string;
  prizeDescriptionEN?: string;
  prizeDescriptionNL?: string;
  stats: EndScreenStats;
  kills: EndScreenKillNode[];
}

export interface GotchaProp {
  id: string;
  nameEN: string;
  nameNL: string;
}

export interface CreatePropRequest {
  nameEN: string;
  nameNL: string;
}

export interface UpdatePropRequest {
  nameEN: string;
  nameNL: string;
}
