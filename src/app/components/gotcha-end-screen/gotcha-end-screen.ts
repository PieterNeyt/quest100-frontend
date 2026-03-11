import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  Input,
  OnDestroy,
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

interface GraphNode extends d3Type.SimulationNodeDatum {
  id: string;
  name: string;
  pic: string | null;
  kills: number;
  isWinner: boolean;
}

const AWARD_ICONS: Record<string, string> = {
  'first-blood':      'lucideZap',
  'serial-killer':    'lucideSwords',
  'speed-demon':      'lucideTimer',
  'patient-hunter':   'lucideClock',
  'best-disguise':    'lucideThumbsUp',
  'deadliest-weapon': 'lucidePackage',
  'first-victim':     'lucideSkull',
  'unlucky':          'lucideFrown',
  'afk-victim':       'lucideBedDouble',
  'final-victim':     'lucideChevronLast',
  'bloodiest-day':    'lucideCalendarDays',
};

@Component({
  selector: 'app-gotcha-end-screen',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports, FullNamePipe, InitialsPipe, PhotoSrcPipe, PropNamePipe, FormatDatePipe],
  providers: [provideIcons(lucideIcons), FullNamePipe, InitialsPipe, PropNamePipe],
  templateUrl: './gotcha-end-screen.html',
  styleUrl: './gotcha-end-screen.css',
})
export class GotchaEndScreenComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) data!: EndScreen;
  @ViewChild('graphCanvas') graphCanvas!: ElementRef<SVGSVGElement>;

  readonly t = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fullNamePipe = inject(FullNamePipe);
  private readonly initialsPipe = inject(InitialsPipe);
  private readonly propNamePipe = inject(PropNamePipe);

  selectedKill        = signal<EndScreenKillNode | null>(null);
  showKillDetail      = signal(false);
  selectedPersonKills = signal<EndScreenKillNode[]>([]);
  selectedPersonName  = signal('');

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
    { key: 'core',   labelKey: 'gotcha.awards.cat.core',   icon: 'lucideShield' },
    { key: 'skill',  labelKey: 'gotcha.awards.cat.skill',  icon: 'lucideTarget' },
    { key: 'social', labelKey: 'gotcha.awards.cat.social', icon: 'lucideHeart' },
    { key: 'prop',   labelKey: 'gotcha.awards.cat.prop',   icon: 'lucidePackage' },
    { key: 'meme',   labelKey: 'gotcha.awards.cat.meme',   icon: 'lucideLaugh' },
    { key: 'game',   labelKey: 'gotcha.awards.cat.game',   icon: 'lucideBarChart2' },
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

  ngOnDestroy() { this.simulation?.stop(); }

  private async buildGraph() {
    this.d3 = await import('d3') as typeof d3Type;
    const d3 = this.d3;
    const svgEl = this.graphCanvas.nativeElement;
    const width = svgEl.clientWidth || 640;
    const height = 480;

    d3.select(svgEl).selectAll('*').remove();
    this.svg = d3.select(svgEl).attr('height', height);
    const g = this.svg.append('g');

    this.zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e: any) => g.attr('transform', e.transform));
    this.svg.call(this.zoom);

    const nodeMap = new Map<string, GraphNode>();
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
    const links = this.data.kills.map(k => ({ source: k.hunter.id, target: k.victim.id, kill: k }));

    const defs = this.svg.append('defs');
    nodes.forEach(n => {
      if (n.pic) {
        defs.append('pattern').attr('id', `pic-${n.id}`).attr('width', 1).attr('height', 1)
          .attr('patternContentUnits', 'objectBoundingBox')
          .append('image').attr('xlink:href', n.pic).attr('width', 1).attr('height', 1)
          .attr('preserveAspectRatio', 'xMidYMid slice');
      }
    });

    this.simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(60));

    const linkGroup = g.append('g').selectAll('g').data(links).join('g');
    linkGroup.append('path').attr('stroke', 'transparent').attr('stroke-width', 15).attr('fill', 'none')
      .style('cursor', 'pointer').on('click', (_e: any, d: any) => this.openKillDetail(d.kill));
    linkGroup.append('path').attr('stroke', '#e5383b').attr('stroke-width', 2).attr('fill', 'none').attr('stroke-dasharray', '5,5');

    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer')
      .on('click', (_e: any, d: any) => {
        const nodeKills = this.data.kills.filter(k => k.hunter.id === d.id);
        this.selectedPersonKills.set(nodeKills);
        this.selectedPersonName.set(d.name);
      });

    node.append('circle').attr('r', 25)
      .attr('fill', (d: any) => d.pic ? `url(#pic-${d.id})` : (d.isWinner ? '#fbbf24' : '#e5e7eb'))
      .attr('stroke', (d: any) => d.isWinner ? '#fbbf24' : '#d1d5db')
      .attr('stroke-width', 3);

    node.filter((d: any) => !d.pic).append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', '10px').attr('font-weight', 'bold').attr('fill', '#374151')
      .text((d: any) => this.initialsPipe.transform({ firstName: d.name.split(' ')[0], lastName: d.name.split(' ')[1] || '' }));

    const badge = node.filter((d: any) => d.kills > 0).append('g').attr('transform', 'translate(18, -18)');
    badge.append('circle').attr('r', 10).attr('fill', '#e5383b');
    badge.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', 'white').attr('font-size', '10px').text((d: any) => d.kills);

    node.append('text').attr('y', 38).attr('text-anchor', 'middle')
      .attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#1f2937')
      .text((d: any) => d.name.split(' ')[0]);

    this.simulation.on('tick', () => {
      const arcPath = (d: any) => {
        const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      };
      linkGroup.selectAll('path').attr('d', arcPath);
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }
}
