// DEMO LOGIN COMPONENT - delete this file entirely to remove demo support
import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemoAuthService } from '../services/demoAuthService';

@Component({
  selector: 'app-demo-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-login-container">
      <h3>Demo Login</h3>
      <input [(ngModel)]="firstName" placeholder="Voornaam" />
      <input [(ngModel)]="lastName" placeholder="Achternaam" />
      <button (click)="login()">Inloggen als demo gebruiker</button>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
  `
})
export class DemoLoginComponent {
  private demoAuth = inject(DemoAuthService);
  loggedIn = output<void>();

  firstName = '';
  lastName = '';
  error = signal('');

  async login() {
    if (!this.firstName || !this.lastName) {
      this.error.set('Vul voor- en achternaam in');
      return;
    }
    try {
      await this.demoAuth.login(this.firstName, this.lastName);
      this.loggedIn.emit();
    } catch {
      this.error.set('Login mislukt');
    }
  }
}
