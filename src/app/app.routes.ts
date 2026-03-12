import {Routes} from '@angular/router';
import {Profile} from './profile/profile';
import {Home} from './home/home';
import {AttendanceComponent} from './attendance/attendance';
import {MsalGuard} from '@azure/msal-angular';
import {Userlist} from './userlist/userlist';
import {roleGuard} from './guards/role-guard';
import {EventDetailComponent} from './event-detail/event-detail';
import {Qrcode} from './qrcode/qrcode';
import {EventComponent} from './event/event';
import {KudoOverview} from './kudo-overview/kudo-overview';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'profile', component: Profile, canActivate: [MsalGuard]},
  {path: 'event/:eventId', component: EventDetailComponent, canActivate: [MsalGuard]},
  {path: 'event', component: EventComponent, canActivate: [MsalGuard]},
  {path: 'attendance/:classId', component: AttendanceComponent, canActivate: [MsalGuard]},
  {path: 'qrcode', component: Qrcode, canActivate: [MsalGuard, roleGuard], data: {role: 'lector'}},
  {path: 'attendance/:classId', component: AttendanceComponent, canActivate: [MsalGuard]},
  {path: 'userlist', component: Userlist, canActivate: [MsalGuard]},
  {path: 'kudo-overview', component: KudoOverview, canActivate: [MsalGuard]},
];
