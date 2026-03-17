import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {QRCodeResponse} from '../model/qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private http = inject(HttpClient);

  generateQRCode(): Observable<QRCodeResponse> {
    return this.http.post<QRCodeResponse>(`/api/qrcode/generate`, {});
  }

}
