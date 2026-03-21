export interface AgendaItem {
  id: number;
  begin: number;
  end: number;
  status: string;
  courseName: string;
  rooms: string[];
  activity: string;
  attended: boolean;
}
