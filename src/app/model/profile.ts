export interface ProfileStatistics {
  profileId: string;
  kudoKnowledge: number;
  kudoAttendance: number;
  kudoTeamwork: number;
  kudoAtmosphere: number;
  kudoEngagement: number;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kudos: number;
  preferredLanguage?: 'NL' | 'EN';
  customProfilePicture?: string | null;
  campus: string;
  archetypeId: number;
  classId?: string | null;
  class?: {
    Id: string;
    Name: string;
    CourseId: string;
  } | null;
}

export enum ArchetypeId {
  Wizard = 0,
  TeamCatalyst = 1,
  AtmosphereMaker = 2,
  CampusExplorer = 3,
  AcademicGuardian = 4,
}

export interface KudosEntry {
  ID: string;
  ProfileID: string;
  Amount: number;
  Reason: string;
  Type: string;
  Date: string;
  SenderID:string | null;
}

export interface SyncProfileResponse {
  profile: Profile;
  microsoftProfilePicture: string;
  hasClass: boolean;
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
