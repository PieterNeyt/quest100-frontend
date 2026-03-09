import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { TranslationService } from '../services/translationService';
import { GotchaEndScreenComponent } from '../components/gotcha-end-screen/gotcha-end-screen';

@Component({
  selector: 'app-gotcha-end-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, GotchaEndScreenComponent],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-end-page.html',
  styleUrl:    './gotcha-end-page.css',
})
export class GotchaEndPageComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);

  loading = signal(true);
  error   = signal(false);

  data = this.gotchaService.endScreen;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.gotchaService.getEndScreen().subscribe({
      next:  () => this.loading.set(false),
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  goBack() {
    this.router.navigate(['/gotcha']);
  }
}
