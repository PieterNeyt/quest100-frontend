import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QrCode } from '../services/qr-code';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qrcode.html',
  styleUrl: './qrcode.css'
})
export class QrCodeComponent {
  qrCodeImage = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  inputId = signal('');

  constructor(private qrCodeService: QrCode) {}

  generateQRCode(): void {
    const id = this.inputId();

    if (!id.trim()) {
      this.errorMessage.set('Geef een ID in');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.qrCodeImage.set(null);

    this.qrCodeService.generateQRCode(id).subscribe({
      next: (response) => {
        this.qrCodeImage.set(response.qrCode);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error generating QR code:', error);
        this.errorMessage.set('Fout bij het genereren van de QR code');
        this.isLoading.set(false);
      }
    });
  }

  downloadQRCode(): void {
    const qrCode = this.qrCodeImage();
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qrcode-${this.inputId()}.png`;
    link.click();
  }
}
