import {
  Component, computed, inject, Input, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, signal, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import type * as d3Type from 'd3';
import {
  EndScreen, EndScreenKillNode, GameAward, KillFeedProfile,
} from '../model/gotcha';
import { TranslationService } from '../services/translationService';
import * as utils from '../utils/gotchaUtils';

interface GraphNode extends d3Type.SimulationNodeDatum {
  id: string;
  name: string;
  pic: string | null;
  kills: number;
  isWinner: boolean;
}

interface ExtendedAward extends GameAward {
  icon: string;
}

@Component({
  selector: 'app-gotcha-end-screen',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HlmIconImports],
  providers: [provideIcons(lucideIcons)],
  templateUrl: './gotcha-end-screen.html',
  styleUrl: './gotcha-end-screen.css',
})
export class GotchaEndScreenComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) data!: EndScreen;
  @ViewChild('graphCanvas') graphCanvas!: ElementRef<SVGSVGElement>;

  readonly t = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly utils = utils;

  selectedKill        = signal<EndScreenKillNode | null>(null);
  showKillDetail      = signal(false);
  selectedPersonKills = signal<EndScreenKillNode[]>([]);
  selectedPersonName  = signal('');

  private simulation: d3Type.Simulation<any, undefined> | null = null;
  private d3!: typeof d3Type;
  private zoom: any;
  private svg: any;

  fastestKillFormatted = '';

  awards = computed<ExtendedAward[]>(() => this.buildAwards());

  mostUsedProp = computed(() => {
    const propCounts: Record<string, number> = {};
    this.data.kills.forEach(k => {
      if (k.prop) {
        const name = utils.propName(k.prop, this.t.currentLanguage());
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

  readonly awardCategories: Array<{ key: string; labelKey: string; icon: string }> = [
    { key: 'skill',  labelKey: 'gotcha.awards.cat.skill',  icon: 'lucideTarget' },
    { key: 'social', labelKey: 'gotcha.awards.cat.social', icon: 'lucideHeart' },
    { key: 'prop',   labelKey: 'gotcha.awards.cat.prop',   icon: 'lucidePackage' },
    { key: 'meme',   labelKey: 'gotcha.awards.cat.meme',   icon: 'lucideLaugh' },
    { key: 'game',   labelKey: 'gotcha.awards.cat.game',   icon: 'lucideBarChart2' },
  ];

  private buildAwards(): ExtendedAward[] {
    const kills = this.data.kills;
    if (kills.length === 0) return [];

    const lang = this.t.currentLanguage();
    const awards: ExtendedAward[] = [];

    const killCountMap = new Map<string, number>();
    kills.forEach(k => killCountMap.set(k.hunter.id, (killCountMap.get(k.hunter.id) ?? 0) + 1));

    const profileMap = new Map<string, KillFeedProfile>();
    kills.forEach(k => {
      profileMap.set(k.hunter.id, k.hunter);
      profileMap.set(k.victim.id, k.victim);
    });

    const sorted = [...kills].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (sorted.length > 0) {
      awards.push({
        id: 'first-blood', icon: 'lucideZap', category: 'skill', emoji: '',
        titleKey: 'gotcha.awards.firstBlood.title',
        descriptionKey: 'gotcha.awards.firstBlood.desc',
        profile: sorted[0].hunter,
      });
    }

    let serialKillerId = '';
    let serialKillerCount = 0;
    killCountMap.forEach((cnt, id) => {
      if (cnt > serialKillerCount) { serialKillerCount = cnt; serialKillerId = id; }
    });
    const serialKillerProfile = profileMap.get(serialKillerId);
    if (serialKillerProfile) {
      awards.push({
        id: 'serial-killer', icon: 'lucideSwords', category: 'skill', emoji: '',
        titleKey: 'gotcha.awards.serialKiller.title',
        descriptionKey: 'gotcha.awards.serialKiller.desc',
        profile: serialKillerProfile, count: serialKillerCount,
      });
    }

    const mostLikedKill = [...kills].sort((a, b) => ((b as any).likeCount ?? 0) - ((a as any).likeCount ?? 0))[0];
    const topLikes = (mostLikedKill as any).likeCount ?? 0;
    if (topLikes > 0) {
      awards.push({
        id: 'best-disguise', icon: 'lucideThumbsUp', category: 'social', emoji: '',
        titleKey: 'gotcha.awards.bestDisguise.title',
        descriptionKey: 'gotcha.awards.bestDisguise.desc',
        profile: mostLikedKill.hunter, count: topLikes,
      });
    }

    const propKillCounts = new Map<string, { name: string; count: number }>();
    kills.forEach(k => {
      if (!k.prop) return;
      const name = utils.propName(k.prop, lang);
      propKillCounts.set(k.prop.id, { name, count: (propKillCounts.get(k.prop.id)?.count ?? 0) + 1 });
    });

    let deadliestPropName = '';
    let deadliestPropCount = 0;
    propKillCounts.forEach(v => {
      if (v.count > deadliestPropCount) { deadliestPropCount = v.count; deadliestPropName = v.name; }
    });
    if (deadliestPropName) {
      awards.push({
        id: 'deadliest-weapon', icon: 'lucidePackage', category: 'prop', emoji: '',
        titleKey: 'gotcha.awards.deadliestWeapon.title',
        descriptionKey: 'gotcha.awards.deadliestWeapon.desc',
        propName: deadliestPropName, count: deadliestPropCount,
      });
    }

    return awards;
  }

  awardsByCategory(cat: string): ExtendedAward[] {
    return this.awards().filter(a => a.category === cat);
  }

  get winnerName() { return utils.fullName(this.data.winner); }
  get winnerInitials() { return utils.initials(this.data.winner); }

  get prizeDescription() {
    return this.t.currentLanguage() === 'nl' ? this.data.prizeDescriptionNL : this.data.prizeDescriptionEN;
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString(
      this.t.currentLanguage() === 'nl' ? 'nl-BE' : 'en-GB',
      { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    );
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
            name: utils.fullName(p),
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
      })
      .call(d3.drag<any, any>().on('start', dragstarted).on('drag', dragged).on('end', dragended) as any);

    node.append('circle').attr('r', 25)
      .attr('fill', (d: any) => d.pic ? `url(#pic-${d.id})` : (d.isWinner ? '#fbbf24' : '#e5e7eb'))
      .attr('stroke', (d: any) => d.isWinner ? '#fbbf24' : '#d1d5db')
      .attr('stroke-width', 3);

    node.filter((d: any) => !d.pic).append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', '10px').attr('font-weight', 'bold').attr('fill', '#374151')
      .text((d: any) => utils.initials({firstName: d.name.split(' ')[0], lastName: d.name.split(' ')[1] || ''}));

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

    function dragstarted(event: any, d: any) { if (!event.active) d3.select(svgEl).dispatch('restart'); d.fx = d.x; d.fy = d.y; }
    function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
    function dragended(event: any, d: any) { d.fx = null; d.fy = null; }
  }
}
