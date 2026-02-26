import {Routes} from '@angular/router';
import {Profile} from './profile/profile';
import {Home} from './home/home';
import {Qrcode} from './qrcode/qrcode';
import {AttendanceComponent} from './attendance/attendance';
import {MsalGuard} from '@azure/msal-angular';
import {EventComponent} from './event/event';
import {EventDetailComponent} from './event-detail/event-detail';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'profile', component: Profile, canActivate: [MsalGuard] },
  { path: 'qrcode', component: Qrcode, canActivate: [MsalGuard] },
  { path: 'event', component: EventComponent, canActivate: [MsalGuard] },
  { path: 'event/:eventId', component: EventDetailComponent, canActivate: [MsalGuard] },
  { path: 'attendance/:classId', component: AttendanceComponent, canActivate: [MsalGuard] },
];
