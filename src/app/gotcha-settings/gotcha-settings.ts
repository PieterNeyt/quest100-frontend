import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { GotchaProp } from '../model/gotcha';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';

@Component({
  selector: 'app-gotcha-settings',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-settings.html',
  styleUrl: './gotcha-settings.css',
})
export class GotchaSettingsComponent implements OnInit {
  private readonly gotchaService = inject(GotchaService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);

  // ── Loading states ────────────────────────────────────────────────────────
  loadingGame  = signal(true);
  loadingProps = signal(true);
  savingGame   = signal(false);

  // ── Game settings form ────────────────────────────────────────────────────
  editStartDate        = signal('');
  editKillDeadline     = signal(72);
  editPrizePhotoBase64 = signal('');
  editPrizePhotoPreview = signal('');
  editPrizeDescEN      = signal('');
  editPrizeDescNL      = signal('');

  // ── Props state ───────────────────────────────────────────────────────────
  props          = signal<GotchaProp[]>([]);
  savingProp     = signal(false);
  deletingPropId = signal<string | null>(null);

  // Add new prop
  showAddProp = signal(false);
  newPropEN   = signal('');
  newPropNL   = signal('');
  newPropError = signal('');

  // Inline edit existing prop
  editingPropId = signal<string | null>(null);
  editPropEN    = signal('');
  editPropNL    = signal('');

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    this.loadGame();
    this.loadProps();
  }

  goBack() {
    this.router.navigate(['/gotcha']);
  }

  // ── Game settings ─────────────────────────────────────────────────────────

  private loadGame() {
    this.loadingGame.set(true);
    this.gotchaService.getCurrentGame().subscribe({
      next: (game) => {
        const defaultDate = game?.startDate ? new Date(game.startDate) : new Date();
        this.editStartDate.set(this.toDatetimeLocal(defaultDate));
        this.editKillDeadline.set(game?.killDeadlineHours ?? 72);
        this.editPrizePhotoBase64.set(game?.prizePhotoBase64 ?? '');
        this.editPrizePhotoPreview.set(
          game?.prizePhotoBase64 ? `data:image/jpeg;base64,${game.prizePhotoBase64}` : ''
        );
        this.editPrizeDescEN.set(game?.prizeDescriptionEN ?? '');
        this.editPrizeDescNL.set(game?.prizeDescriptionNL ?? '');
        this.loadingGame.set(false);
      },
      error: () => this.loadingGame.set(false),
    });
  }

  onPrizeFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.editPrizePhotoBase64.set(result.split(',')[1]);
      this.editPrizePhotoPreview.set(result);
    };
    reader.readAsDataURL(file);
  }

  clearPrizePhoto() {
    this.editPrizePhotoBase64.set('');
    this.editPrizePhotoPreview.set('');
  }

  saveGameSettings() {
    if (!this.editStartDate()) {
      this.toastService.error('gotcha.editModal.startDateRequired');
      return;
    }
    this.savingGame.set(true);
    this.gotchaService.updateGame({
      startDate:          new Date(this.editStartDate()).toISOString(),
      killDeadlineHours:  this.editKillDeadline(),
      prizePhotoBase64:   this.editPrizePhotoBase64(),
      prizeDescriptionEN: this.editPrizeDescEN(),
      prizeDescriptionNL: this.editPrizeDescNL(),
    }).subscribe({
      next:  () => { this.savingGame.set(false); this.toastService.success('success.saved'); },
      error: () => { this.savingGame.set(false); this.toastService.error('errors.generic'); },
    });
  }

  // ── Props ─────────────────────────────────────────────────────────────────

  loadProps() {
    this.loadingProps.set(true);
    this.gotchaService.getAllProps().subscribe({
      next:  (props) => { this.props.set(props); this.loadingProps.set(false); },
      error: ()      => this.loadingProps.set(false),
    });
  }

  // Add
  openAddProp() {
    this.cancelPropEdit();
    this.newPropEN.set('');
    this.newPropNL.set('');
    this.newPropError.set('');
    this.showAddProp.set(true);
  }

  cancelAddProp() {
    this.showAddProp.set(false);
    this.newPropError.set('');
  }

  addProp() {
    const en = this.newPropEN().trim();
    const nl = this.newPropNL().trim();
    if (!en || !nl) {
      this.newPropError.set(this.t.t('gotcha.settings.bothLangsRequired'));
      return;
    }
    this.savingProp.set(true);
    this.gotchaService.createProp({ nameEN: en, nameNL: nl }).subscribe({
      next: (created) => {
        this.props.update((list) => [...list, created]);
        this.savingProp.set(false);
        this.cancelAddProp();
        this.toastService.success('gotcha.settings.propAdded');
      },
      error: () => {
        this.savingProp.set(false);
        this.toastService.error('errors.generic');
      },
    });
  }

  // Edit
  startPropEdit(prop: GotchaProp) {
    this.cancelAddProp();
    this.editingPropId.set(prop.id);
    this.editPropEN.set(prop.nameEN);
    this.editPropNL.set(prop.nameNL);
  }

  cancelPropEdit() {
    this.editingPropId.set(null);
  }

  savePropEdit(id: string) {
    const en = this.editPropEN().trim();
    const nl = this.editPropNL().trim();
    if (!en || !nl) {
      this.toastService.error('gotcha.settings.bothLangsRequired');
      return;
    }
    this.savingProp.set(true);
    this.gotchaService.updateProp(id, { nameEN: en, nameNL: nl }).subscribe({
      next: (updated) => {
        this.props.update((list) => list.map((p) => (p.id === id ? updated : p)));
        this.savingProp.set(false);
        this.cancelPropEdit();
        this.toastService.success('success.saved');
      },
      error: () => {
        this.savingProp.set(false);
        this.toastService.error('errors.generic');
      },
    });
  }

  // Delete
  deleteProp(id: string) {
    this.deletingPropId.set(id);
    this.gotchaService.deleteProp(id).subscribe({
      next: () => {
        this.props.update((list) => list.filter((p) => p.id !== id));
        this.deletingPropId.set(null);
        this.toastService.success('gotcha.settings.propDeleted');
      },
      error: () => {
        this.deletingPropId.set(null);
        this.toastService.error('errors.generic');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
