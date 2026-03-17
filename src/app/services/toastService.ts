import {inject, Injectable} from '@angular/core';
import {toast} from 'ngx-sonner';
import {TranslationService} from './translationService';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private translationService = inject(TranslationService);

  success(messageKey: string): void {
    const message = this.translationService.t(messageKey);
    toast.success(message);
  }

  error(messageKey: string = 'errors.generic'): void {
    const message = this.translationService.t(messageKey);
    toast.error(message);
  }

  info(messageKey: string): void {
    const message = this.translationService.t(messageKey);
    toast.info(message);
  }

  loading(messageKey: string): void {
    const message = this.translationService.t(messageKey);
    toast.loading(message);
  }
}
