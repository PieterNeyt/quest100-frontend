import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrCodeService } from '../services/qrcodeService';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';

@Component({
  selector: 'app-qrcode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qrcode.html',
  styleUrl: './qrcode.css'
})
export class Qrcode {
  private qrCodeService = inject(QrCodeService);
  private toastService = inject(ToastService);
  isFullscreen = signal(false);
  public t = inject(TranslationService);

  qrCodeImage = signal<string | null>(null);
  isLoading = signal(false);

  generateQRCode(): void {
    this.isLoading.set(true);
    this.qrCodeImage.set(null);

    this.qrCodeService.generateQRCode().subscribe({
      next: (response) => {
        this.qrCodeImage.set(response.qrCode);
        this.isLoading.set(false);
        this.toastService.success('qrCode.success');
      },
      error: (error) => {
        console.error('Error generating QR code:', error);
        this.toastService.error('qrCode.error');
        this.isLoading.set(false);
      }
    });
  }

  changeFullScreen() {
    this.isFullscreen.set(!this.isFullscreen());
    console.log(this.isFullscreen());
    if (this.isFullscreen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }
}
