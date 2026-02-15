import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environment/environment';

export type Language = 'nl' | 'en';

export type Translations = {
  [key: string]: string | Translations;
};

export interface LanguageOption {
  code: Language;
  name: string;
  flagClass: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private url = environment.apiConfig.uri;
  private assetsUrl = environment.apiConfig.assetsUri;
  private translations = signal<Translations>({});
  currentLanguage = signal<Language>('en');

  readonly availableLanguages: LanguageOption[] = [
    { code: 'nl', name: 'Nederlands', flagClass: 'fi fi-nl' },
    { code: 'en', name: 'English', flagClass: 'fi fi-gb' }
  ];

  constructor() {}

  async loadTranslations(lang: Language): Promise<void> {
    try {
      const translations = await firstValueFrom(
        this.http.get(`${this.assetsUrl}/${lang}.json`)
      ) as Translations;
      this.translations.set(translations);
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      this.translations.set({});
    }
  }

  async setLanguage(lang: Language): Promise<void> {
    this.currentLanguage.set(lang);
    await this.loadTranslations(lang);

    try {
      await firstValueFrom(
        this.http.put(`${this.url}/api/profiles/language`, {
          language: lang.toUpperCase()
        })
      );
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }
  }

  setLanguageFromProfile(lang: Language): void {
    this.currentLanguage.set(lang);
    this.loadTranslations(lang);
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: string | Translations | undefined = this.translations();

    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  t = (key: string) => this.translate(key);

  getCurrentFlagClass(): string {
    const current = this.availableLanguages.find(
      lang => lang.code === this.currentLanguage()
    );
    return current?.flagClass ?? 'fi fi-gb';
  }
}
