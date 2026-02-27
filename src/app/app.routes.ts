import {Routes} from '@angular/router';
import {Profile} from './profile/profile';
import {Home} from './home/home';
import {QrCodeComponent} from './qrcode/qrcode';
import {AttendanceComponent} from './attendance/attendance';
import {MsalGuard} from '@azure/msal-angular';
import {roleGuard} from './guards/role-guard';
import {Chat} from './chat/chat';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'profile', component: Profile, canActivate: [MsalGuard]},
  {path: 'qrcode', component: QrCodeComponent, canActivate: [MsalGuard, roleGuard], data: {role: 'lector'}},
  {path: 'attendance/:classId', component: AttendanceComponent, canActivate: [MsalGuard]},
  {path: "chat", component: Chat, canActivate: [MsalGuard]},
];
