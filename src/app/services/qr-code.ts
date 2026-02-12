import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QRCodeResponse {
  qrCode: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class QrCode {
  private apiUrl = 'http://localhost:8080/qrcode';

  constructor(private http: HttpClient) { }

  generateQRCode(id: string): Observable<QRCodeResponse> {
    return this.http.post<QRCodeResponse>(`${this.apiUrl}/generate`, { id });
  }
}
