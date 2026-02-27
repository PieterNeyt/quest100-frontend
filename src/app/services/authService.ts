import {inject, Injectable} from '@angular/core';
import {MsalService} from '@azure/msal-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msal = inject(MsalService);

  isLoggedIn() {
    return this.msal.instance.getActiveAccount() !== null;
  }
}
