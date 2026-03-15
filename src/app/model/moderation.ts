export interface ReportResponse {
  id: string;
  targetId: string;
  contextId?: string;
  channelType: number;
  reportType: number;
  message: string;
  createdAt: string;
}
