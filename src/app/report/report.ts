import {Component, EventEmitter, Input, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';

export enum ReportType {
  Harassment = 'harassment',
  Racism = 'racism',
  Spam = 'spam',
  HateSpeech = 'hate_speech',
  Other = 'other',
}

export interface ReportPayload {
  eventId: string | number;
  type: ReportType;
  message: string;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class ReportComponent implements OnInit {
  @Input() eventId!: string | number;
  @Input() eventTitle?: string;
  @Output() closed = new EventEmitter<void>();

  private readonly fb = new FormBuilder();

  submitting = signal(false);
  submitted = signal(false);

  reportForm!: FormGroup;

  readonly reportTypes: { value: ReportType; label: string; icon: string }[] = [
    { value: ReportType.Harassment, label: 'Harassment',  icon: 'lucideShieldAlert' },
    { value: ReportType.Racism,     label: 'Racism',      icon: 'lucideAlertOctagon' },
    { value: ReportType.Spam,       label: 'Spam',        icon: 'lucideMail' },
    { value: ReportType.HateSpeech, label: 'Hate Speech', icon: 'lucideMessageSquareWarning' },
    { value: ReportType.Other,      label: 'Other',       icon: 'lucideFlag' },
  ];

  ngOnInit() {
    this.reportForm = this.fb.group({
      type: [null, Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    });
  }

  close() {
    this.closed.emit();
  }

  submit() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const payload: ReportPayload = {
      eventId: this.eventId,
      type: this.reportForm.value.type,
      message: this.reportForm.value.message,
    };

    // Simulate async submit
    setTimeout(() => {
      console.log('[Report submitted]', payload);
      this.submitting.set(false);
      this.submitted.set(true);
    }, 800);
  }

  get messageLength(): number {
    return this.reportForm?.get('message')?.value?.length ?? 0;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.reportForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
