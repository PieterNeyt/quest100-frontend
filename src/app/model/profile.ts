export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kudos: number;
  preferredLanguage?: 'NL' | 'EN';
  customProfilePicture?: string | null;
  campus: string;
}

export interface ProfileStatistics {
  profileId: string;
  kudoKnowledge: number;
  kudoAttendance: number;
  kudoTeamwork: number;
  kudoAtmosphere: number;
  kudoEngagement: number;
}

export interface KudosEntry {
  ID: string;
  ProfileID: string;
  Amount: number;
  Reason: string;
  Type: string;
  Date: string;
}

export interface SyncProfileResponse {
  profile: Profile;
  microsoftProfilePicture: string;
}

export interface AwardTransaction {
  receiver: string;
  type: KudoType;
  message: string;
}

export enum KudoType {
  KudoKnowledge="KudoKnowledge",
  KudoAttendance="KudoAttendance",
  KudoTeamwork="KudoTeamwork",
  KudoAtmosphere="KudoAtmosphere",
  KudoEngagement="KudoEngagement"
}

export interface ProfileAward{
  profile: Profile;
  hasSentAward: boolean;
}
