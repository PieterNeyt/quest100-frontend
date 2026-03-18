import {Component, inject, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {TranslationService} from '../../services/translationService';
import {GotchaGame} from '../../model/gotcha';

@Component({
  selector: 'app-gotcha-rules',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-rules.html',
  styleUrl: './gotcha-rules.css',
})
export class GotchaRulesComponent {
  readonly t = inject(TranslationService);

  game = input<GotchaGame | null>(null);

  get prizeDescription(): string | null {
    const g = this.game();
    if (!g) return null;
    return this.t.currentLanguage() === 'nl'
      ? (g.prizeDescriptionNL ?? null)
      : (g.prizeDescriptionEN ?? null);
  }

  get killDeadlineHours(): number | null {
    return this.game()?.killDeadlineHours ?? null;
  }

  get hasPrize(): boolean {
    const g = this.game();
    return !!(g?.prizePhotoBase64 || g?.prizeDescriptionEN || g?.prizeDescriptionNL);
  }
}
