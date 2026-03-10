import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { GotchaService } from '../services/gotchaService';
import { GotchaProp } from '../model/gotcha';
import { TranslationService } from '../services/translationService';
import { ToastService } from '../services/toastService';
import { toDatetimeLocal } from '../utils/gotchaUtils';
import {ProfileService} from '../services/profileService';

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
  private readonly profileService = inject(ProfileService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);
  readonly t = inject(TranslationService);

  currentGame = this.gotchaService.currentGame;

  isEditable = computed(() => {
    const status = this.currentGame()?.status;
    return status == null || status === 'OPT_IN' || status === 'FINISHED';
  });
  // Loading states
  loadingGame  = signal(true);
  loadingProps = signal(true);
  savingGame   = signal(false);

  //  Game settings form
  editStartDate        = signal('');
  editKillDeadline     = signal(72);
  editPrizePhotoBase64 = signal('');
  editPrizePhotoPreview = signal('');
  editPrizeDescEN      = signal('');
  editPrizeDescNL      = signal('');

  // Props state
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

  // Lifecycle

  ngOnInit() {
    this.loadGame();
    this.loadProps();
  }

  goBack() {
    this.router.navigate(['/gotcha']);
  }

  private loadGame() {
    this.loadingGame.set(true);
    this.gotchaService.getCurrentGame().subscribe({
      next: (game) => {
        if (!game || game.status === 'FINISHED') {
          this.editStartDate.set(toDatetimeLocal(new Date()));
          this.editKillDeadline.set(72);
          this.editPrizePhotoBase64.set('');
          this.editPrizePhotoPreview.set('');
          this.editPrizeDescEN.set('');
          this.editPrizeDescNL.set('');
          this.loadingGame.set(false);
          return;
        }
        this.editStartDate.set(toDatetimeLocal(new Date(game.startDate ?? new Date())));
        this.editKillDeadline.set(game.killDeadlineHours ?? 72);
        this.editPrizePhotoBase64.set(game.prizePhotoBase64 ?? '');
        this.editPrizePhotoPreview.set(
          game.prizePhotoBase64 ? `data:image/jpeg;base64,${game.prizePhotoBase64}` : ''
        );
        this.editPrizeDescEN.set(game.prizeDescriptionEN ?? '');
        this.editPrizeDescNL.set(game.prizeDescriptionNL ?? '');
        this.loadingGame.set(false);
      },
      error: () => {
        this.editStartDate.set(toDatetimeLocal(new Date()));
        this.editKillDeadline.set(72);
        this.loadingGame.set(false);
      },
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
    if (!this.isEditable()) return;

    if (!this.editStartDate()) {
      this.toastService.error('gotcha.editModal.startDateRequired');
      return;
    }

    const startDate = new Date(this.editStartDate());
    if (startDate <= new Date()) {
      this.toastService.error('gotcha.editModal.startDatePast');
      return;
    }

    if (!this.editKillDeadline() || this.editKillDeadline() < 1) {
      this.toastService.error('gotcha.editModal.killDeadlineRequired');
      return;
    }

    if (!this.editPrizePhotoBase64()) {
      this.toastService.error('gotcha.editModal.prizePhotoRequired');
      return;
    }

    if (!this.editPrizeDescEN().trim()) {
      this.toastService.error('gotcha.editModal.prizeDescENRequired');
      return;
    }

    if (!this.editPrizeDescNL().trim()) {
      this.toastService.error('gotcha.editModal.prizeDescNLRequired');
      return;
    }

    const payload = {
      startDate:          startDate.toISOString(),
      killDeadlineHours:  this.editKillDeadline(),
      prizePhotoBase64:   this.editPrizePhotoBase64(),
      prizeDescriptionEN: this.editPrizeDescEN(),
      prizeDescriptionNL: this.editPrizeDescNL(),
      campus: this.profileService.profile()?.campus,
    };
    this.savingGame.set(true);
    this.gotchaService.createGame(payload).subscribe({
      next: () => {
        this.savingGame.set(false);
        this.toastService.success('success.saved');
      },
      error: () => { this.savingGame.set(false); this.toastService.error('errors.generic'); },
    });
  }

  //  Props

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
    if (!this.isEditable()) return;
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

  deleteProp(id: string) {
    if (!this.isEditable()) {
      this.toastService.error('gotcha.settings.locked');
      return;
    }
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
}
