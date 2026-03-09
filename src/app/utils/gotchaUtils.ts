import {KillFeedProp} from '../model/gotcha';

export function fullName(p: { firstName: string; lastName: string } | null | undefined): string {
  if (!p) return '';
  return `${p.firstName} ${p.lastName}`.trim();
}

export function initials(p: { firstName: string; lastName: string } | null | undefined): string {
  if (!p) return '?';
  return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
}

export function photoSrc(base64: string | null | undefined): string {
  if (!base64) return '';
  if (base64.startsWith('data:')) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

export function propName(prop: KillFeedProp | null | undefined, lang: string): string {
  if (!prop) return '';
  return lang === 'nl' ? (prop.nameNL || prop.nameEN) : (prop.nameEN || prop.nameNL);
}

export function statusClass(status: string | undefined): string {
  if (!status) return '';
  const classes: Record<string, string> = {
    PENDING: 'status-pending', APPROVED: 'status-approved', DENIED: 'status-denied',
    OPT_IN: 'status-opt-in', ACTIVE: 'status-active', FINISHED: 'status-finished'
  };
  return classes[status] ?? '';
}

export function toDatetimeLocal(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
