import {Routes} from '@angular/router';
import {Profile} from './profile/profile';
import {Home} from './home/home';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'profile', component: Profile},
];
