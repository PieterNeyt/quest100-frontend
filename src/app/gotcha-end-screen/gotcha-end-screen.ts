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
    { key: 'core',   labelKey: 'gotcha.awards.cat.core',   icon: 'lucideShield' },
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
    const sortedKills = [...kills].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Hulp-maps
    const killCountMap = new Map<string, number>();
    kills.forEach(k => killCountMap.set(k.hunter.id, (killCountMap.get(k.hunter.id) ?? 0) + 1));

    const profileMap = new Map<string, KillFeedProfile>();
    kills.forEach(k => {
      profileMap.set(k.hunter.id, k.hunter);
      profileMap.set(k.victim.id, k.victim);
    });

    // ── SKILL AWARDS ──────────────────────────────────────────────────────────

    // First Blood
    awards.push({
      id: 'first-blood', icon: 'lucideZap', category: 'skill', emoji: '',
      titleKey: 'gotcha.awards.firstBlood.title',
      descriptionKey: 'gotcha.awards.firstBlood.desc',
      profile: sortedKills[0].hunter,
    });

    // Serial Killer
    let serialKillerId = '';
    let serialKillerCount = 0;
    killCountMap.forEach((cnt, id) => {
      if (cnt > serialKillerCount) { serialKillerCount = cnt; serialKillerId = id; }
    });
    if (serialKillerId) {
      awards.push({
        id: 'serial-killer', icon: 'lucideSwords', category: 'skill', emoji: '',
        titleKey: 'gotcha.awards.serialKiller.title',
        descriptionKey: 'gotcha.awards.serialKiller.desc',
        profile: profileMap.get(serialKillerId), count: serialKillerCount,
      });
    }

    // Speed Demon & Patient Hunter
    const killsByHunter = new Map<string, EndScreenKillNode[]>();
    kills.forEach(k => {
      if (!killsByHunter.has(k.hunter.id)) killsByHunter.set(k.hunter.id, []);
      killsByHunter.get(k.hunter.id)!.push(k);
    });

    let fastestGap = Infinity;
    let speedDemonP: KillFeedProfile | undefined;
    let slowestGap = 0;
    let patientHunterP: KillFeedProfile | undefined;

    killsByHunter.forEach((hKills, id) => {
      if (hKills.length < 2) return;
      const sorted = hKills.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (let i = 1; i < sorted.length; i++) {
        const gap = (new Date(sorted[i].createdAt).getTime() - new Date(sorted[i - 1].createdAt).getTime()) / 1000;
        if (gap < fastestGap) { fastestGap = gap; speedDemonP = profileMap.get(id); }
        if (gap > slowestGap) { slowestGap = gap; patientHunterP = profileMap.get(id); }
      }
    });

    if (speedDemonP) {
      const mins = Math.floor(fastestGap / 60);
      awards.push({
        id: 'speed-demon', icon: 'lucideTimer', category: 'skill', emoji: '',
        titleKey: 'gotcha.awards.speedDemon.title',
        descriptionKey: 'gotcha.awards.speedDemon.desc',
        profile: speedDemonP, count: mins > 0 ? mins : 1, // Toon minuten, minimaal 1
      });
    }

    if (patientHunterP) {
      awards.push({
        id: 'patient-hunter', icon: 'lucideClock', category: 'skill', emoji: '',
        titleKey: 'gotcha.awards.patientHunter.title',
        descriptionKey: 'gotcha.awards.patientHunter.desc',
        profile: patientHunterP, count: Math.round(slowestGap / 3600), // Toon uren
      });
    }

    // ── SOCIAL AWARDS ─────────────────────────────────────────────────────────

    // Best Disguise (Meeste likes)
    const mostLiked = [...kills].sort((a, b) => ((b as any).likeCount ?? 0) - ((a as any).likeCount ?? 0))[0];
    if (mostLiked && (mostLiked as any).likeCount > 0) {
      awards.push({
        id: 'best-disguise', icon: 'lucideThumbsUp', category: 'social', emoji: '',
        titleKey: 'gotcha.awards.bestDisguise.title',
        descriptionKey: 'gotcha.awards.bestDisguise.desc',
        profile: mostLiked.hunter, count: (mostLiked as any).likeCount,
      });
    }

    // ── PROP AWARDS ───────────────────────────────────────────────────────────

    // Deadliest Weapon
    const propCounts = new Map<string, { name: string, count: number }>();
    kills.forEach(k => {
      if (!k.prop) return;
      const name = utils.propName(k.prop, lang);
      propCounts.set(k.prop.id, { name, count: (propCounts.get(k.prop.id)?.count ?? 0) + 1 });
    });
    let bestProp = { name: '', count: 0 };
    propCounts.forEach(v => { if (v.count > bestProp.count) bestProp = v; });
    if (bestProp.count > 0) {
      awards.push({
        id: 'deadliest-weapon', icon: 'lucidePackage', category: 'prop', emoji: '',
        titleKey: 'gotcha.awards.deadliestWeapon.title',
        descriptionKey: 'gotcha.awards.deadliestWeapon.desc',
        propName: bestProp.name, count: bestProp.count,
      });
    }

    // ── MEME AWARDS ───────────────────────────────────────────────────────────

    // First Victim
    awards.push({
      id: 'first-victim', icon: 'lucideSkull', category: 'meme', emoji: '',
      titleKey: 'gotcha.awards.firstVictim.title',
      descriptionKey: 'gotcha.awards.firstVictim.desc',
      profile: sortedKills[0].victim,
    });

    // Unlucky (Gelimineerd binnen 2 uur na de allereerste kill)
    const firstKillTime = new Date(sortedKills[0].createdAt).getTime();
    const unluckyOnes = sortedKills
      .filter((k, index) => index > 0 && (new Date(k.createdAt).getTime() - firstKillTime) < 7200000)
      .map(k => k.victim);
    if (unluckyOnes.length > 0) {
      awards.push({
        id: 'unlucky', icon: 'lucideFrown', category: 'meme', emoji: '',
        titleKey: 'gotcha.awards.unlucky.title',
        descriptionKey: 'gotcha.awards.unlucky.desc',
        profiles: unluckyOnes,
      });
    }

    // AFK Victim (Wel in het spel, maar geen enkele kill gemaakt voordat ze stierven)
    const hunterIds = new Set(kills.map(k => k.hunter.id));
    const afkVictims = Array.from(profileMap.values()).filter(p => !hunterIds.has(p.id));
    if (afkVictims.length > 0) {
      awards.push({
        id: 'afk-victim', icon: 'lucideBedDouble', category: 'meme', emoji: '',
        titleKey: 'gotcha.awards.afkVictim.title',
        descriptionKey: 'gotcha.awards.afkVictim.desc',
        profiles: afkVictims,
      });
    }

    // ── GAME AWARDS ───────────────────────────────────────────────────────────

    // Final Victim (Het laatste slachtoffer van de winnaar)
    awards.push({
      id: 'final-victim', icon: 'lucideChevronLast', category: 'game', emoji: '',
      titleKey: 'gotcha.awards.finalVictim.title',
      descriptionKey: 'gotcha.awards.finalVictim.desc',
      profile: sortedKills[sortedKills.length - 1].victim,
    });

    // Bloodiest Day
    const dayCounts = new Map<string, number>();
    kills.forEach(k => {
      const day = new Date(k.createdAt).toLocaleDateString(lang === 'nl' ? 'nl-BE' : 'en-GB', { day: 'numeric', month: 'short' });
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    });
    let bestDay = { day: '', count: 0 };
    dayCounts.forEach((cnt, day) => { if (cnt > bestDay.count) bestDay = { day, count: cnt }; });
    if (bestDay.count > 0) {
      awards.push({
        id: 'bloodiest-day', icon: 'lucideCalendarDays', category: 'game', emoji: '',
        titleKey: 'gotcha.awards.bloodiestDay.title',
        descriptionKey: 'gotcha.awards.bloodiestDay.desc',
        day: bestDay.day, count: bestDay.count,
      });
    }

    return awards;
  }

  awardsByCategory(cat: string): ExtendedAward[] {
    return this.awards().filter(a => a.category === cat);
  }

  get winnerName() { return utils.fullName(this.data.winner); }
  get winnerInitials() { return utils.initials(this.data.winner); }
  get prizeDescription() { return this.t.currentLanguage() === 'nl' ? this.data.prizeDescriptionNL : this.data.prizeDescriptionEN; }
  formatDate(d: string) { return new Date(d).toLocaleDateString(this.t.currentLanguage() === 'nl' ? 'nl-BE' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  initials(p: any) { return utils.initials(p); }


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
      });

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
  }
}
