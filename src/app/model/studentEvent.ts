export interface StudentEvent {
  id: string;
  title: string;
  description: string;
  photo?: string | null;
  category: EventCategory;
  organizerId: string;
  eventDate: string;
  maxAttendees?: number | null;
  createdAt: string;
  updatedAt: string;

  attendees: EventAttendee[];
}

export interface EventAttendee {
  id: string;
  eventId: string;
  profileId: string;
  joinedAt: string;
}

export type EventCategory =
  | "SPORTS"
  | "GAMING"
  | "STUDY"
  | "FOOD"
  | "MUSIC"
  | "OUTDOOR"
  | "SOCIAL"
  | "OTHER";
