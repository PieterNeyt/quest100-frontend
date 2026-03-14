import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environment/environment';
import {QRCodeResponse} from '../model/qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private url = environment.apiConfig.uri;
  private http = inject(HttpClient);

  generateQRCode(): Observable<QRCodeResponse> {
    return this.http.post<QRCodeResponse>(`${this.url}/api/qrcode/generate`, {});
  }

}
