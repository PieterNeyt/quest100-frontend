import { EventCategory } from '../model/studentEvent';

export interface CategoryMeta {
  color: string;
  icon: string;
  key: EventCategory;
}

const CATEGORY_ICONS: Record<EventCategory, string> = {
  SPORTS:  `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  GAMING:  `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M9 21V7"/><path d="M15 21V7"/><path d="M2 14h20"/>`,
  STUDY:   `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
  FOOD:    `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>`,
  MUSIC:   `<circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V5l10-2v11"/>`,
  OUTDOOR: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  SOCIAL:  `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  OTHER:   `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  SPORTS:  '#ff9600',
  GAMING:  '#ce82ff',
  STUDY:   '#1cb0f6',
  FOOD:    '#ff4b4b',
  MUSIC:   '#ff86d0',
  OUTDOOR: '#58cc02',
  SOCIAL:  '#ffd900',
  OTHER:   '#89e219',
};

export const CATEGORIES: EventCategory[] = [
  'SPORTS', 'GAMING', 'STUDY', 'FOOD', 'MUSIC', 'OUTDOOR', 'SOCIAL', 'OTHER'
];

export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat as EventCategory] ?? '#afafaf';
}

export function categoryIconSvg(cat: string, size = 20): string {
  const paths = CATEGORY_ICONS[cat as EventCategory] ?? `<circle cx="12" cy="12" r="10"/>`;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}">${paths}</svg>`;
}
