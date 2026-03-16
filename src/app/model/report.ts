export enum ReportType {
  Harassment = 0,
  Racism = 1,
  Spam = 2,
  HateSpeech = 3,
  Other = 4,
}

export enum ChannelType {
  Event = 0,
  Message = 1,
  Award = 2,
}

export interface Report {
  id: string;
  userId: string;
  targetId: string;
  contextId?: string;
  resolved: boolean;
  channelType: ChannelType;
  reportType: ReportType;
  message: string;
}

