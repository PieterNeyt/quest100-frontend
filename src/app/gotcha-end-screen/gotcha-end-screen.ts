import {
  Component, inject, Input, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, signal, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as lucideIcons from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import type * as d3Type from 'd3';
import { EndScreen, EndScreenKillNode, KillFeedProfile } from '../model/gotcha';
import { TranslationService } from '../services/translationService';

interface GraphNode extends d3Type.SimulationNodeDatum {
  id: string;
  name: string;
  pic: string | null;
  kills: number;
  isWinner: boolean;
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

  selectedKill = signal<EndScreenKillNode | null>(null);
  showKillDetail = signal(false);

  // Nieuw: Voor de lijst per persoon
  selectedPersonKills = signal<EndScreenKillNode[]>([]);
  selectedPersonName = signal('');

  private simulation: d3Type.Simulation<any, undefined> | null = null;
  private d3!: typeof d3Type;
  private zoom: any;
  private svg: any;

  // Extra berekende stats
  mortalityRate = 0;
  mostUsedProp = 'Geen';

  ngOnInit() {
    this.calculateExtraStats();
  }

  calculateExtraStats() {
    if (this.data.stats.totalParticipants > 0) {
      this.mortalityRate = Math.round((this.data.stats.totalKills / this.data.stats.totalParticipants) * 100);
    }
    const propCounts: Record<string, number> = {};
    this.data.kills.forEach(k => {
      if (k.prop) propCounts[k.prop.name] = (propCounts[k.prop.name] || 0) + 1;
    });
    this.mostUsedProp = Object.entries(propCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }

  // ... (bestaande helpers als winnerName, winnerInitials, formatDate blijven gelijk) ...
  get winnerName() { return `${this.data.winner?.firstName} ${this.data.winner?.lastName}`; }
  get winnerInitials() { return `${this.data.winner?.firstName?.[0]}${this.data.winner?.lastName?.[0]}`; }
  get prizeDescription() { return this.t.currentLanguage() === 'nl' ? this.data.prizeDescriptionNL : this.data.prizeDescriptionEN; }
  formatDate(d: string) { return new Date(d).toLocaleDateString(); }
  fullName(p: KillFeedProfile) { return `${p.firstName} ${p.lastName}`; }
  initials(p: KillFeedProfile) { return `${p.firstName?.[0]}${p.lastName?.[0]}`; }

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

    this.zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e: { transform: any; }) => g.attr('transform', e.transform));
    this.svg.call(this.zoom);

    // 1. Data voorbereiden
    const nodeMap = new Map<string, GraphNode>();
    this.data.kills.forEach((k: { hunter: { id: string; }; victim: any; }) => {
      [k.hunter, k.victim].forEach(p => {
        if (!nodeMap.has(p.id)) {
          nodeMap.set(p.id, { id: p.id, name: this.fullName(p), pic: p.profilePicture || null, kills: 0, isWinner: p.id === this.data.winner?.id });
        }
      });
      nodeMap.get(k.hunter.id)!.kills++;
    });

    const nodes = Array.from(nodeMap.values());
    const links = this.data.kills.map((k: { hunter: { id: any; }; victim: { id: any; }; }) => ({ source: k.hunter.id, target: k.victim.id, kill: k }));

    // 2. SVG DEFS voor profielfoto's
    const defs = this.svg.append('defs');
    nodes.forEach(n => {
      if (n.pic) {
        defs.append('pattern')
          .attr('id', `pic-${n.id}`).attr('width', 1).attr('height', 1).attr('patternContentUnits', 'objectBoundingBox')
          .append('image').attr('xlink:href', n.pic).attr('width', 1).attr('height', 1).attr('preserveAspectRatio', 'xMidYMid slice');
      }
    });

    // 3. Simulatie
    this.simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(60));

    // 4. Lijnen (Hitbox + Visueel)
    const linkGroup = g.append('g').selectAll('g').data(links).join('g');

    // De onzichtbare dikke hitbox
    linkGroup.append('path')
      .attr('stroke', 'transparent').attr('stroke-width', 15).attr('fill', 'none').style('cursor', 'pointer')
      .on('click', (e: any, d: any) => this.openKillDetail(d.kill));

    // De visuele lijn
    const linkPath = linkGroup.append('path')
      .attr('stroke', '#e5383b').attr('stroke-width', 2).attr('fill', 'none').attr('stroke-dasharray', '5,5');

    // 5. Nodes
    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer')
      .on('click', (e: any, d: any) => {
        const kills = this.data.kills.filter((k: { hunter: { id: any; }; }) => k.hunter.id === d.id);
        this.selectedPersonKills.set(kills);
        this.selectedPersonName.set(d.name);
      })
      .call(d3.drag<any, any>().on('start', dragstarted).on('drag', dragged).on('end', dragended) as any);

    // Cirkel met foto of initials
    node.append('circle').attr('r', 25)
      .attr('fill', (d: any) => d.pic ? `url(#pic-${d.id})` : (d.isWinner ? '#fbbf24' : '#e5e7eb'))
      .attr('stroke', (d: any) => d.isWinner ? '#fbbf24' : '#fff').attr('stroke-width', 3);

    node.filter((d: any) => !d.pic).append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('font-size', '10px').attr('font-weight', 'bold')
      .text((d: any) => d.name.split(' ').map((n:any)=>n[0]).join(''));

    // Kill badge
    const badge = node.filter((d:any) => d.kills > 0).append('g').attr('transform', 'translate(18, -18)');
    badge.append('circle').attr('r', 10).attr('fill', '#e5383b');
    badge.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('fill', 'white').attr('font-size', '10px').text((d:any) => d.kills);

    // Naam label
    node.append('text').attr('y', 38).attr('text-anchor', 'middle').attr('font-size', '11px').attr('font-weight', '600').text((d:any) => d.name.split(' ')[0]);

    this.simulation.on('tick', () => {
      linkPath.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      g.selectAll('path').filter(':first-child').attr('d', (d: any) => { // Update ook hitbox
        const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // 6. Direct centreren op winnaar
    const winner = nodes.find(n => n.isWinner);
    if (winner) {
      setTimeout(() => {
        const transform = d3.zoomIdentity.translate(width/2, height/2).scale(1.3).translate(-(winner.x||0), -(winner.y||0));
        this.svg.transition().duration(1000).call(this.zoom.transform, transform);
      }, 500);
    }

    function dragstarted(event: any, d: any) {
      if (!event.active) d3.select(svgEl).dispatch('restart');
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
    function dragended(event: any, d: any) { d.fx = null; d.fy = null; }
  }
}
