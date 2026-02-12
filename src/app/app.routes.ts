import { Routes } from '@angular/router';
import { QrCodeComponent } from './qrcode/qrcode';

export const routes: Routes = [
  { path: '', component: QrCodeComponent },
  { path: 'qrcode', component: QrCodeComponent }
];
