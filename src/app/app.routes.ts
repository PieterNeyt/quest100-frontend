import {Routes} from '@angular/router';
import {Profile} from './profile/profile';
import {Home} from './home/home';
import {MsalGuard} from '@azure/msal-angular';
export const routes: Routes = [
  {path: '', component: Home},
  {path: 'profile', component: Profile, canActivate: [MsalGuard]},
];
