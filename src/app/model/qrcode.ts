import {Profile} from './profile';

export interface QRCodeResponse {
  qrCode: string;
  id: string;
}

export interface AttendanceResponse {
  message: string;
  alreadyRegistered: boolean;
  profile: Profile;
  kudosEarned: number;
}
