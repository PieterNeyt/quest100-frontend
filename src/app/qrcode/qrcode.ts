import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrCodeService } from '../services/qrcodeService';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-qrcode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qrcode.html',
  styleUrl: './qrcode.css'
})
export class QrCodeComponent {
  private qrCodeService = inject(QrCodeService);
  public t = inject(TranslationService);
  qrCodeImage = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // voorlopig gwn hardcoded class id tot timeedit integratie
  private readonly TEMP_CLASS_ID = '00000000-0000-0000-0000-000000000001';

  generateQRCode(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.qrCodeImage.set(null);

    this.qrCodeService.generateQRCode(this.TEMP_CLASS_ID).subscribe({
      next: (response) => {
        this.qrCodeImage.set(response.qrCode);
        this.isLoading.set(false);
        this.successMessage.set('QR-code succesfully generated');
      },
      error: (error) => {
        console.error('Error generating QR code:', error);
        this.errorMessage.set('Something went wrong while generating QR-code');
        this.isLoading.set(false);
      }
    });
  }
}
