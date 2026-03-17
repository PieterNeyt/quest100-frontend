import {Component, computed, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {ToastService} from '../../services/toastService';
import {ModerationService} from '../../services/moderationService';
import {TranslationService} from '../../services/translationService';

export enum ReportType {
  Harassment = 0,
  Racism     = 1,
  Spam       = 2,
  HateSpeech = 3,
  Other      = 4,
}

export interface ReportPayload {
  targetId: string | number;
  contextId?: string;
  channelType: number;
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
  @Input() targetId!: string | number;
  @Input() contextId?: string;
  @Input() channelType!: number;
  @Input() eventTitle?: string;
  @Output() closed = new EventEmitter<void>();

  private readonly fb = new FormBuilder();
  private readonly ts = inject(ToastService);
  private readonly moderationService = inject(ModerationService);
  readonly t = inject(TranslationService);

  submitting = signal(false);
  submitted  = signal(false);

  reportForm!: FormGroup;

  readonly reportTypes = computed<{ value: ReportType; label: string; icon: string }[]>(() => [
    { value: ReportType.Harassment, label: this.t.t('report.types.harassment'), icon: 'lucideShieldAlert'          },
    { value: ReportType.Racism,     label: this.t.t('report.types.racism'),     icon: 'lucideAlertOctagon'         },
    { value: ReportType.Spam,       label: this.t.t('report.types.spam'),       icon: 'lucideMail'                 },
    { value: ReportType.HateSpeech, label: this.t.t('report.types.hateSpeech'), icon: 'lucideMessageSquareWarning' },
    { value: ReportType.Other,      label: this.t.t('report.types.other'),      icon: 'lucideFlag'                 },
  ]);

  ngOnInit() {
    this.reportForm = this.fb.group({
      type:    [null, Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    });
  }

  close() { this.closed.emit(); }

  submit() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const payload: ReportPayload = {
      targetId:    this.targetId,
      contextId:   this.contextId,
      channelType: this.channelType,
      type:        this.reportForm.value.type,
      message:     this.reportForm.value.message,
    };

    this.moderationService.createReport(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.ts.success(this.t.t('report.submitted'));
        this.close();
      },
      error: (err) => {
        this.submitting.set(false);
        const message = err?.error?.error ?? this.t.t('errors.generic');
        this.ts.error(message);
      },
    });
  }

  get messageLength(): number {
    return this.reportForm?.get('message')?.value?.length ?? 0;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.reportForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
