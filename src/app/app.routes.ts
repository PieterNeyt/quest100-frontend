import {Routes} from '@angular/router';
import {Profile} from './profile/profile';
import {Home} from './home/home';
import {AttendanceComponent} from './attendance/attendance';
import {MsalGuard} from '@azure/msal-angular';
import {Userlist} from './userlist/userlist';
import {EventDetailComponent} from './event-detail/event-detail';
import {Qrcode} from './qrcode/qrcode';
import {EventComponent} from './event/event';
import {Avatar} from './avatar/avatar';
import {KudoOverview} from './kudo-overview/kudo-overview';
import {GotchaPageComponent} from './gotcha-page/gotcha-page';
import {GotchaEndPageComponent} from './gotcha-end-page/gotcha-end-page';
import {GotchaSettingsComponent} from './gotcha-settings/gotcha-settings';
import {GotchaHistoryPageComponent} from './gotcha-history-page/gotcha-history-page';
import {AboutComponent} from './about/about';
import {Dashboard} from './dashboard/dashboard';
import {reportEvent} from './dashboard/report-event/report-event';
import {reportChat} from './dashboard/report-chat/report-chat';
import {ReportAward} from './dashboard/report-award/report-award';
import {NerdlePageComponent} from './nerdle/nerdle';
import {MinesweeperPageComponent} from './minesweeper/minesweeper';
import {SudokuPageComponent} from './sudoku/sudoku';
import {roleGuard} from './guards/role-guard';
import {Role} from './model/role';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'profile', component: Profile, canActivate: [MsalGuard]},
  {path: 'event/:eventId', component: EventDetailComponent, canActivate: [MsalGuard]},
  {path: 'event', component: EventComponent, canActivate: [MsalGuard]},
  {
    path: 'attendance/:classId',
    component: AttendanceComponent,
    canActivate: [MsalGuard, roleGuard],
    data: {role: Role.STUDENT}
  },
  {path: 'qrcode', component: Qrcode, canActivate: [MsalGuard, roleGuard], data: {role: Role.STUDENT}},
  {path: 'userlist', component: Userlist, canActivate: [MsalGuard]},
  {path: 'avatar', component: Avatar, canActivate: [MsalGuard]},
  {path: 'kudo-overview', component: KudoOverview, canActivate: [MsalGuard]},
  {path: 'gotcha', component: GotchaPageComponent, canActivate: [MsalGuard]},
  {path: 'gotcha/end', component: GotchaEndPageComponent, canActivate: [MsalGuard]},
  {path: 'gotcha/end/:gameId', component: GotchaEndPageComponent, canActivate: [MsalGuard]},
  {path: 'gotcha/history', component: GotchaHistoryPageComponent, canActivate: [MsalGuard]},
  {path: 'gotcha/settings', component: GotchaSettingsComponent, canActivate: [MsalGuard, roleGuard], data: {role: Role.LECTOR}},
  {path: 'about', component: AboutComponent, canActivate: [MsalGuard]},
  {
    path: 'reports',
    canActivateChild: [MsalGuard, roleGuard],
    data: {role: Role.ADMIN},
    children: [
      {path: 'dashboard', component: Dashboard},
      {path: ':reportId/event/:eventId', component: reportEvent},
      {path: ':reportId/message/:messageId/chat/:chatId', component: reportChat},
      {path: ':reportId/award/:targetId', component: ReportAward}
    ]
  },
  { path: 'minigames/nerdle', component: NerdlePageComponent, canActivate: [MsalGuard]},
  { path: 'minigames/minesweeper', component: MinesweeperPageComponent, canActivate: [MsalGuard] },
  { path: 'minigames/sudoku', component: SudokuPageComponent, canActivate: [MsalGuard] },

];
