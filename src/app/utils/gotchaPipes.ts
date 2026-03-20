import {inject, Pipe, PipeTransform} from '@angular/core';
import {KillFeedProp} from '../model/gotcha';
import {TranslationService} from '../services/translationService';

@Pipe({ name: 'fullName', standalone: true })
export class FullNamePipe implements PipeTransform {
  transform(p: { firstName: string; lastName: string } | null | undefined): string {
    if (!p) return '';
    return `${p.firstName} ${p.lastName}`.trim();
  }
}

@Pipe({ name: 'initials', standalone: true })
export class InitialsPipe implements PipeTransform {
  transform(p: { firstName: string; lastName: string } | null | undefined): string {
    if (!p) return '?';
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
  }
}

@Pipe({ name: 'photoSrc', standalone: true })
export class PhotoSrcPipe implements PipeTransform {
  transform(src: string | null | undefined): string {
    if (!src) return '';
    if (src.startsWith('data:')) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    return `data:image/jpeg;base64,${src}`;
  }
}
@Pipe({ name: 'propName', standalone: true })
export class PropNamePipe implements PipeTransform {
  private readonly t = inject(TranslationService);

  transform(prop: KillFeedProp | null | undefined, lang?: string): string {
    if (!prop) return '';
    const activeLang = lang ?? this.t.currentLanguage() ?? 'en';
    return activeLang === 'nl' ? (prop.nameNL || prop.nameEN) : (prop.nameEN || prop.nameNL);
  }
}

@Pipe({ name: 'statusClass', standalone: true })
export class StatusClassPipe implements PipeTransform {
  transform(status: string | undefined): string {
    if (!status) return '';
    const classes: Record<string, string> = {
      PENDING:  'status-pending',
      APPROVED: 'status-approved',
      DENIED:   'status-denied',
      OPT_IN:   'status-opt-in',
      ACTIVE:   'status-active',
      FINISHED: 'status-finished',
    };
    return classes[status] ?? '';
  }
}

@Pipe({ name: 'datetimeLocal', standalone: true })
export class DatetimeLocalPipe implements PipeTransform {
  transform(d: Date | string | null | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
