export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kudos: number;
  preferredLanguage?: 'NL' | 'EN';
  customProfilePicture?: string | null;
}
