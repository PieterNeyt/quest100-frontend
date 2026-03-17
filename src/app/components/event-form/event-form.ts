import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TranslationService} from '../../services/translationService';
import {CATEGORIES} from '../../utils/Categoryutils';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.css',
})
export class EventFormComponent {
  @Input() form!: FormGroup;
  @Input() saving = false;
  @Input() submitLabel = '';
  @Input() cancelLabel = '';
  @Input() mode: 'create' | 'edit' = 'create';

  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly t = inject(TranslationService);
  readonly categories = CATEGORIES;

  get minDate(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  categoryLabel(cat: string): string {
    return this.t.t(`event.categories.${cat}`);
  }

  sanitizeMaxAttendees(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.form.patchValue({
      maxAttendees: input.value === '' ? null : Number(input.value)
    }, { emitEvent: false });
  }

  validateEventDate() {
    const control = this.form.get('eventDate');
    if (!control?.value) return;
    const selected = new Date(control.value);
    if (selected <= new Date()) {
      control.setErrors({ ...control.errors, pastDate: true });
    } else {
      const errors = { ...control.errors };
      delete errors['pastDate'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }
  get eventDateControl() {
    return this.form.controls['eventDate'];
  }
}
