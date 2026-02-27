export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kudos: number;
  preferredLanguage?: 'NL' | 'EN';
  customProfilePicture?: string | null;
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
