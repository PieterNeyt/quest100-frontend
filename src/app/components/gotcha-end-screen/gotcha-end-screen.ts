import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  Input,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {NgIconComponent, provideIcons} from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import type * as d3Type from 'd3';
import {EndScreen, EndScreenKillNode} from '../../model/gotcha';
import {TranslationService} from '../../services/translationService';
import {FormatDatePipe, FullNamePipe, InitialsPipe, PhotoSrcPipe, PropNamePipe} from '../../utils/gotchaPipes';

const AWARD_ICONS: Record<string, string> = {
  'first-blood': 'lucideZap',
  'serial-killer': 'lucideSwords',
  'speed-demon': 'lucideTimer',
  'patient-hunter': 'lucideClock',
  'best-disguise': 'lucideThumbsUp',
  'deadliest-weapon': 'lucidePackage',
  'first-victim': 'lucideSkull',
  'unlucky': 'lucideFrown',
  'afk-victim': 'lucideBedDouble',
  'final-victim': 'lucideChevronLast',
  'bloodiest-day': 'lucideCalendarDays',
};

@Component({
  selector: 'app-gotcha-end-screen',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, FullNamePipe, InitialsPipe, PhotoSrcPipe, PropNamePipe, FormatDatePipe],
  providers: [provideIcons(lucideIcons), FullNamePipe, InitialsPipe, PropNamePipe],
  templateUrl: './gotcha-end-screen.html',
  styleUrl: './gotcha-end-screen.css',
})
export class GotchaEndScreenComponent implements OnInit, AfterViewInit {
  @Input({required: true}) data!: EndScreen;
  @ViewChild('graphCanvas') graphCanvas!: ElementRef<SVGSVGElement>;

  readonly t = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fullNamePipe = inject(FullNamePipe);
  private readonly initialsPipe = inject(InitialsPipe);
  private readonly propNamePipe = inject(PropNamePipe);

  selectedKill = signal<EndScreenKillNode | null>(null);
  showKillDetail = signal(false);
  selectedPersonKills = signal<EndScreenKillNode[]>([]);
  selectedPersonName = signal('');

  private simulation: d3Type.Simulation<any, undefined> | null = null;
  private d3!: typeof d3Type;
  private zoom: any;
  private svg: any;

  fastestKillFormatted = '';

  awards = computed(() =>
    (this.data.awards ?? []).map(a => ({
      ...a,
      icon: AWARD_ICONS[a.id] ?? 'lucideTrophy',
    }))
  );

  mostUsedProp = computed(() => {
    const propCounts: Record<string, number> = {};
    this.data.kills.forEach(k => {
      if (k.prop) {
        const name = this.propNamePipe.transform(k.prop);
        propCounts[name] = (propCounts[name] || 0) + 1;
      }
    });
    return Object.entries(propCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  });

  ngOnInit() {
    this.calculateExtraStats();
  }

  calculateExtraStats() {
    const secs = this.data.stats.fastestKillSecs;
    if (secs > 0) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      this.fastestKillFormatted = h > 0 ? `${h}u ${m}m` : `${m}m`;
    } else {
      this.fastestKillFormatted = '—';
    }
  }

  readonly awardCategories = [
    {key: 'core', labelKey: 'gotcha.awards.cat.core', icon: 'lucideShield'},
    {key: 'skill', labelKey: 'gotcha.awards.cat.skill', icon: 'lucideTarget'},
    {key: 'social', labelKey: 'gotcha.awards.cat.social', icon: 'lucideHeart'},
    {key: 'prop', labelKey: 'gotcha.awards.cat.prop', icon: 'lucidePackage'},
    {key: 'meme', labelKey: 'gotcha.awards.cat.meme', icon: 'lucideLaugh'},
    {key: 'game', labelKey: 'gotcha.awards.cat.game', icon: 'lucideBarChart2'},
  ];

  awardsByCategory(cat: string) {
    return this.awards().filter(a => a.category === cat);
  }

  get prizeDescription() {
    return this.t.currentLanguage() === 'nl' ? this.data.prizeDescriptionNL : this.data.prizeDescriptionEN;
  }

  openKillDetail(kill: EndScreenKillNode) {
    this.selectedKill.set(kill);
    this.showKillDetail.set(true);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.data.kills.length > 0) {
      setTimeout(() => this.buildGraph(), 100);
    }
  }

  private async buildGraph() {
    this.d3 = await import('d3') as typeof d3Type;
    const d3 = this.d3;
    const svgEl = this.graphCanvas.nativeElement;
    const width = svgEl.clientWidth || 640;

    const nodeMap = new Map<string, {
      id: string; name: string; pic: string | null;
      kills: number; isWinner: boolean;
    }>();

    this.data.kills.forEach(k => {
      [k.hunter, k.victim].forEach(p => {
        if (!nodeMap.has(p.id)) {
          nodeMap.set(p.id, {
            id: p.id,
            name: this.fullNamePipe.transform(p),
            pic: p.profilePicture || null,
            kills: 0,
            isWinner: p.id === this.data.winner?.id,
          });
        }
      });
      nodeMap.get(k.hunter.id)!.kills++;
    });

    const nodes = Array.from(nodeMap.values());

    const sortedKills = [...this.data.kills].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const links = sortedKills.map(k => ({
      sourceId: k.hunter.id,
      targetId: k.victim.id,
      kill: k,
    }));

    // Laagberekening
    const layerMap = new Map<string, number>();
    nodes.forEach(n => layerMap.set(n.id, 0));

    let changed = true;
    let guard = 0;
    while (changed && guard++ < 1000) {
      changed = false;
      links.forEach(l => {
        const srcLayer = layerMap.get(l.sourceId) ?? 0;
        const tgtLayer = layerMap.get(l.targetId) ?? 0;
        if (tgtLayer <= srcLayer) {
          layerMap.set(l.targetId, srcLayer + 1);
          changed = true;
        }
      });
    }

    const layerGroups = new Map<number, string[]>();
    layerMap.forEach((layer, id) => {
      if (!layerGroups.has(layer)) layerGroups.set(layer, []);
      layerGroups.get(layer)!.push(id);
    });

    const totalLayers = Math.max(...Array.from(layerMap.values())) + 1;
    const layerHeight = Math.max(120, Math.min(160, 600 / totalLayers));
    const height = Math.max(500, totalLayers * layerHeight + 100);
    const nodeRadius = 25;

    // Bereken x,y per node
    const posMap = new Map<string, { x: number; y: number }>();

    layerGroups.forEach((ids, layer) => {
      const y = 60 + layer * layerHeight;
      const count = ids.length;
      const spacing = Math.min(160, (width - 80) / Math.max(count, 1));
      const totalW = (count - 1) * spacing;
      const startX = width / 2 - totalW / 2;
      ids.forEach((id, i) => {
        posMap.set(id, {x: startX + i * spacing, y});
      });
    });

    //  SVG setup
    d3.select(svgEl).selectAll('*').remove();
    this.svg = d3.select(svgEl).attr('height', height);
    const g = this.svg.append('g');

    this.zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (e: any) => g.attr('transform', e.transform));
    this.svg.call(this.zoom as any);

    // Defs: pijlpunt + profielfoto patronen
    const defs = this.svg.append('defs');

    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#e5383b');

    nodes.forEach(n => {
      if (n.pic) {
        defs.append('pattern')
          .attr('id', `pic-${n.id}`)
          .attr('width', 1).attr('height', 1)
          .attr('patternContentUnits', 'objectBoundingBox')
          .append('image')
          .attr('xlink:href', n.pic)
          .attr('width', 1).attr('height', 1)
          .attr('preserveAspectRatio', 'xMidYMid slice');
      }
    });

    // Parallelle link offset
    const linkKey = (a: string, b: string) => [a, b].sort().join('--');
    const pairCount = new Map<string, number>();
    const pairIndex = new Map<any, number>();

    links.forEach(l => {
      const key = linkKey(l.sourceId, l.targetId);
      const idx = pairCount.get(key) ?? 0;
      pairIndex.set(l, idx);
      pairCount.set(key, idx + 1);
    });

    //  Pad berekening
    const makePath = (l: typeof links[0]) => {
      const src = posMap.get(l.sourceId);
      const tgt = posMap.get(l.targetId);
      if (!src || !tgt) return '';

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return '';

      const r = nodeRadius;
      const ox = (dx / dist) * r;
      const oy = (dy / dist) * r;
      const x1 = src.x + ox, y1 = src.y + oy;
      const x2 = tgt.x - ox, y2 = tgt.y - oy;

      const key = linkKey(l.sourceId, l.targetId);
      const total = pairCount.get(key) ?? 1;
      const idx = pairIndex.get(l) ?? 0;

      if (total === 1) {
        return `M${x1},${y1}L${x2},${y2}`;
      }

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const perpX = -(y2 - y1) / dist;
      const perpY = (x2 - x1) / dist;
      const sign = idx % 2 === 0 ? 1 : -1;
      const magnitude = 40 * Math.ceil((idx + 1) / 2);

      return `M${x1},${y1}Q${mx + perpX * sign * magnitude},${my + perpY * sign * magnitude} ${x2},${y2}`;
    };

    //  Render links
    const linkGroup = g.append('g').selectAll('g').data(links).join('g');

    linkGroup.append('path')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 15)
      .attr('fill', 'none')
      .style('cursor', 'pointer')
      .on('click', (_e: any, d: any) => this.openKillDetail(d.kill))
      .attr('d', (d: any) => makePath(d));

    linkGroup.append('path')
      .attr('stroke', '#e5383b')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '5,5')
      .attr('marker-end', 'url(#arrow)')
      .attr('d', (d: any) => makePath(d));

    //  Render nodes
    const nodeGroup = g.append('g').selectAll('g').data(nodes).join('g')
      .attr('transform', (d: any) => {
        const pos = posMap.get(d.id)!;
        return `translate(${pos.x},${pos.y})`;
      })
      .style('cursor', 'pointer')
      .on('click', (_e: any, d: any) => {
        const nodeKills = this.data.kills.filter(k => k.hunter.id === d.id);
        this.selectedPersonKills.set(nodeKills);
        this.selectedPersonName.set(d.name);
      });

    nodeGroup.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d: any) => d.pic ? `url(#pic-${d.id})` : (d.isWinner ? '#fbbf24' : '#e5e7eb'))
      .attr('stroke', (d: any) => d.isWinner ? '#fbbf24' : '#d1d5db')
      .attr('stroke-width', 3);

    nodeGroup.filter((d: any) => !d.pic).append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', '10px').attr('font-weight', 'bold').attr('fill', '#374151')
      .text((d: any) => this.initialsPipe.transform({
        firstName: d.name.split(' ')[0],
        lastName: d.name.split(' ')[1] || ''
      }));

    const badge = nodeGroup.filter((d: any) => d.kills > 0)
      .append('g').attr('transform', 'translate(18, -18)');
    badge.append('circle').attr('r', 10).attr('fill', '#e5383b');
    badge.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', 'white').attr('font-size', '10px')
      .text((d: any) => d.kills);

    nodeGroup.append('text')
      .attr('y', nodeRadius + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#1f2937')
      .text((d: any) => d.name.split(' ')[0]);

    this.simulation = null;
  }
}
