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

interface GraphNode extends d3Type.SimulationNodeDatum {
  id: string;
  name: string;
  pic: string | null;
  kills: number;
  isWinner: boolean;
}

// Extended award with icon instead of emoji
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
    const isNL = this.t.currentLanguage() === 'nl';
    this.data.kills.forEach(k => {
      if (k.prop) {
        const name = isNL ? k.prop.nameNL : k.prop.nameEN;
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

  // ── Award categories with lucide icons ───────────────────────────────────

  readonly awardCategories: Array<{ key: string; labelKey: string; icon: string }> = [
    { key: 'skill',  labelKey: 'gotcha.awards.cat.skill',  icon: 'lucideTarget' },
    { key: 'social', labelKey: 'gotcha.awards.cat.social', icon: 'lucideHeart' },
    { key: 'prop',   labelKey: 'gotcha.awards.cat.prop',   icon: 'lucidePackage' },
    { key: 'meme',   labelKey: 'gotcha.awards.cat.meme',   icon: 'lucideLaugh' },
    { key: 'game',   labelKey: 'gotcha.awards.cat.game',   icon: 'lucideBarChart2' },
  ];

  // ── Award calculation ─────────────────────────────────────────────────────

  private buildAwards(): ExtendedAward[] {
    const kills = this.data.kills;
    if (kills.length === 0) return [];

    const isNL = this.t.currentLanguage() === 'nl';
    const awards: ExtendedAward[] = [];

    const killCountMap = new Map<string, number>();
    kills.forEach(k => killCountMap.set(k.hunter.id, (killCountMap.get(k.hunter.id) ?? 0) + 1));

    const profileMap = new Map<string, KillFeedProfile>();
    kills.forEach(k => {
      profileMap.set(k.hunter.id, k.hunter);
      profileMap.set(k.victim.id, k.victim);
    });

    // ── SKILL ─────────────────────────────────────────────────────────────────

    const sorted = [...kills].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // First Blood
    if (sorted.length > 0) {
      awards.push({
        id: 'first-blood', icon: 'lucideZap', category: 'skill',
        emoji: '',
        titleKey: 'gotcha.awards.firstBlood.title',
        descriptionKey: 'gotcha.awards.firstBlood.desc',
        profile: sorted[0].hunter,
      });
    }

    // Serial Killer — most kills (exclude winner to avoid double award feel)
    let serialKillerId = '';
    let serialKillerCount = 0;
    killCountMap.forEach((cnt, id) => {
      if (cnt > serialKillerCount) { serialKillerCount = cnt; serialKillerId = id; }
    });
    const serialKillerProfile = profileMap.get(serialKillerId);
    if (serialKillerProfile) {
      awards.push({
        id: 'serial-killer', icon: 'lucideSwords', category: 'skill',
        emoji: '',
        titleKey: 'gotcha.awards.serialKiller.title',
        descriptionKey: 'gotcha.awards.serialKiller.desc',
        profile: serialKillerProfile,
        count: serialKillerCount,
      });
    }

    // Speed Demon — shortest gap between consecutive kills by same hunter
    const killsByHunter = new Map<string, EndScreenKillNode[]>();
    kills.forEach(k => {
      if (!killsByHunter.has(k.hunter.id)) killsByHunter.set(k.hunter.id, []);
      killsByHunter.get(k.hunter.id)!.push(k);
    });

    let fastestGapSecs = Infinity;
    let speedDemonProfile: KillFeedProfile | undefined;
    killsByHunter.forEach((hKills, hunterId) => {
      if (hKills.length < 2) return;
      const s2 = [...hKills].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (let i = 1; i < s2.length; i++) {
        const gap = (new Date(s2[i].createdAt).getTime() - new Date(s2[i - 1].createdAt).getTime()) / 1000;
        if (gap < fastestGapSecs) { fastestGapSecs = gap; speedDemonProfile = profileMap.get(hunterId); }
      }
    });
    if (speedDemonProfile) {
      awards.push({
        id: 'speed-demon', icon: 'lucideTimer', category: 'skill',
        emoji: '',
        titleKey: 'gotcha.awards.speedDemon.title',
        descriptionKey: 'gotcha.awards.speedDemon.desc',
        profile: speedDemonProfile,
        count: Math.round(fastestGapSecs / 60),
      });
    }

    // Patient Hunter
    let slowestGapSecs = 0;
    let patientHunterProfile: KillFeedProfile | undefined;
    killsByHunter.forEach((hKills, hunterId) => {
      if (hKills.length < 2) return;
      const s3 = [...hKills].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const gap = (new Date(s3[s3.length - 1].createdAt).getTime() - new Date(s3[0].createdAt).getTime()) / 1000;
      if (gap > slowestGapSecs) { slowestGapSecs = gap; patientHunterProfile = profileMap.get(hunterId); }
    });
    if (patientHunterProfile) {
      awards.push({
        id: 'patient-hunter', icon: 'lucideClock', category: 'skill',
        emoji: '',
        titleKey: 'gotcha.awards.patientHunter.title',
        descriptionKey: 'gotcha.awards.patientHunter.desc',
        profile: patientHunterProfile,
        count: Math.round(slowestGapSecs / 3600),
      });
    }

    // ── SOCIAL ────────────────────────────────────────────────────────────────

    const mostLikedKill = [...kills].sort((a, b) => ((b as any).likeCount ?? 0) - ((a as any).likeCount ?? 0))[0];
    const topLikes = (mostLikedKill as any).likeCount ?? 0;
    if (topLikes > 0) {
      awards.push({
        id: 'best-disguise', icon: 'lucideThumbsUp', category: 'social',
        emoji: '',
        titleKey: 'gotcha.awards.bestDisguise.title',
        descriptionKey: 'gotcha.awards.bestDisguise.desc',
        profile: mostLikedKill.hunter,
        count: topLikes,
      });
    }

    // ── PROP ──────────────────────────────────────────────────────────────────

    const propKillCounts = new Map<string, { name: string; count: number }>();
    kills.forEach(k => {
      if (!k.prop) return;
      const name = isNL ? k.prop.nameNL : k.prop.nameEN;
      propKillCounts.set(k.prop.id, { name, count: (propKillCounts.get(k.prop.id)?.count ?? 0) + 1 });
    });
    let deadliestPropName = '';
    let deadliestPropCount = 0;
    propKillCounts.forEach(v => {
      if (v.count > deadliestPropCount) { deadliestPropCount = v.count; deadliestPropName = v.name; }
    });
    if (deadliestPropName) {
      awards.push({
        id: 'deadliest-weapon', icon: 'lucidePackage', category: 'prop',
        emoji: '',
        titleKey: 'gotcha.awards.deadliestWeapon.title',
        descriptionKey: 'gotcha.awards.deadliestWeapon.desc',
        propName: deadliestPropName,
        count: deadliestPropCount,
      });
    }

    // ── MEME ──────────────────────────────────────────────────────────────────

    // AFK Victims — victims that never made a kill
    const hunterIds = new Set(kills.map(k => k.hunter.id));
    const victimIds = new Set(kills.map(k => k.victim.id));
    const afkVictims: KillFeedProfile[] = [];
    victimIds.forEach(id => {
      if (!hunterIds.has(id)) {
        const profile = profileMap.get(id);
        if (profile) afkVictims.push(profile);
      }
    });
    if (afkVictims.length > 0) {
      awards.push({
        id: 'afk-victim', icon: 'lucideBedDouble', category: 'meme',
        emoji: '',
        titleKey: 'gotcha.awards.afkVictim.title',
        descriptionKey: 'gotcha.awards.afkVictim.desc',
        profiles: afkVictims,
        count: afkVictims.length,
      });
    }

    // ── GAME ──────────────────────────────────────────────────────────────────

    const killsByDay = new Map<string, number>();
    kills.forEach(k => {
      const day = new Date(k.createdAt).toLocaleDateString(isNL ? 'nl-BE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      killsByDay.set(day, (killsByDay.get(day) ?? 0) + 1);
    });
    let bloodiestDay = '';
    let bloodiestDayCount = 0;
    killsByDay.forEach((count, day) => {
      if (count > bloodiestDayCount) { bloodiestDayCount = count; bloodiestDay = day; }
    });
    if (bloodiestDay) {
      awards.push({
        id: 'bloodiest-day', icon: 'lucideCalendarDays', category: 'game',
        emoji: '',
        titleKey: 'gotcha.awards.bloodiestDay.title',
        descriptionKey: 'gotcha.awards.bloodiestDay.desc',
        day: bloodiestDay,
        count: bloodiestDayCount,
      });
    }

    return awards;
  }

  awardsByCategory(cat: string): ExtendedAward[] {
    return this.awards().filter(a => a.category === cat);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get winnerName() {
    return `${this.data.winner?.firstName} ${this.data.winner?.lastName}`;
  }

  get winnerInitials() {
    return `${this.data.winner?.firstName?.[0]}${this.data.winner?.lastName?.[0]}`;
  }

  get prizeDescription() {
    return this.t.currentLanguage() === 'nl'
      ? this.data.prizeDescriptionNL
      : this.data.prizeDescriptionEN;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  photoSrc(base64: string | null | undefined): string {
    if (!base64) return '';
    if (base64.startsWith('data:')) return base64;
    return `data:image/jpeg;base64,${base64}`;
  }

  propName(prop: { nameEN: string; nameNL: string } | null | undefined): string {
    if (!prop) return '';
    return this.t.currentLanguage() === 'nl' ? prop.nameNL : prop.nameEN;
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString(
      this.t.currentLanguage() === 'nl' ? 'nl-BE' : 'en-GB',
      { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    );
  }

  fullName(p: KillFeedProfile) { return `${p.firstName} ${p.lastName}`; }
  initials(p: KillFeedProfile) { return `${p.firstName?.[0]}${p.lastName?.[0]}`; }

  openKillDetail(kill: EndScreenKillNode) {
    this.selectedKill.set(kill);
    this.showKillDetail.set(true);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.data.kills.length > 0) {
      setTimeout(() => this.buildGraph(), 100);
    }
  }

  ngOnDestroy() { this.simulation?.stop(); }

  // ── Graph ─────────────────────────────────────────────────────────────────

  private async buildGraph() {
    this.d3 = await import('d3') as typeof d3Type;
    const d3 = this.d3;
    const svgEl = this.graphCanvas.nativeElement;
    const width = svgEl.clientWidth || 640;
    const height = 480;

    d3.select(svgEl).selectAll('*').remove();
    this.svg = d3.select(svgEl).attr('height', height);
    const g = this.svg.append('g');

    this.zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (e: { transform: any }) => g.attr('transform', e.transform));
    this.svg.call(this.zoom);

    const nodeMap = new Map<string, GraphNode>();
    this.data.kills.forEach(k => {
      [k.hunter, k.victim].forEach(p => {
        if (!nodeMap.has(p.id)) {
          nodeMap.set(p.id, {
            id: p.id,
            name: this.fullName(p),
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
    linkGroup.append('path').attr('stroke', '#e5383b').attr('stroke-width', 2)
      .attr('fill', 'none').attr('stroke-dasharray', '5,5');

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
      .text((d: any) => d.name.split(' ').map((n: any) => n[0]).join(''));

    const badge = node.filter((d: any) => d.kills > 0).append('g').attr('transform', 'translate(18, -18)');
    badge.append('circle').attr('r', 10).attr('fill', '#e5383b');
    badge.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', 'white').attr('font-size', '10px').text((d: any) => d.kills);

    node.append('text').attr('y', 38).attr('text-anchor', 'middle')
      .attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#1f2937')
      .text((d: any) => d.name.split(' ')[0]);

    this.simulation.on('tick', () => {
      const arcPath = (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      };
      linkGroup.selectAll('path').attr('d', arcPath);
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    const winner = nodes.find(n => n.isWinner);
    if (winner) {
      setTimeout(() => {
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2).scale(1.3)
          .translate(-(winner.x || 0), -(winner.y || 0));
        this.svg.transition().duration(1000).call(this.zoom.transform, transform);
      }, 500);
    }

    function dragstarted(event: any, d: any) { if (!event.active) d3.select(svgEl).dispatch('restart'); d.fx = d.x; d.fy = d.y; }
    function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
    function dragended(event: any, d: any) { d.fx = null; d.fy = null; }
  }
}
