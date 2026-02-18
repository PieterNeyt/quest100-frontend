import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { QRCodeResponse, AttendanceResponse } from '../model/qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private url = environment.apiConfig.uri;
  private http = inject(HttpClient);

  generateQRCode(classId: string): Observable<QRCodeResponse> {
    return this.http.post<QRCodeResponse>(`${this.url}/api/qrcode/generate`, { id: classId });
  }

}
