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
  visibility: string;
  attendees: EventAttendee[];
}

export interface EventAttendee {
  eventId: string;
  profileId: string;
  joinedAt: string;
  firstName?: string;
  lastName?: string;
  customProfilePicture?: string | null;
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
