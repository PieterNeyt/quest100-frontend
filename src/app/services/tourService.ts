import { inject, Injectable } from '@angular/core';
import { driver, Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { TranslationService } from './translationService';

@Injectable({ providedIn: 'root' })
export class TourService {
  readonly t = inject(TranslationService);
  private driverObj?: Driver;

  // --- VERBETERDE TIMING & POSITIE LOGICA ---

  private async safeScroll(selector: string, accordionHeaderSelector?: string) {
    // 1. Als het in een accordion zit, klik die eerst open
    if (accordionHeaderSelector) {
      const header = document.querySelector(accordionHeaderSelector) as HTMLElement;
      if (header && !header.classList.contains('active')) { // Check of hij niet al open is
        header.click();
        // Geef de browser heel even de tijd om de height te berekenen
        await new Promise(r => requestAnimationFrame(r));
      }
    }

    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      // 2. Instant scroll (GEEN smooth). Dit voorkomt dat Driver.js misrekent.
      el.scrollIntoView({ behavior: 'auto', block: 'center' });

      // 3. Forceer een kleine pauze zodat de browser de nieuwe coordinaten 'vastzet'
      await new Promise(r => setTimeout(r, 100));

      // 4. Update de Driver.js overlay naar de nieuwe plek
      this.driverObj?.refresh();
    }
  }

  private getIcon(name: 'calendar' | 'plus' | 'filter' | 'flag' | 'target' | 'shield' | 'sliders' | 'alert' | 'check' | 'zap' | 'user' | 'shopping' | 'rocket' | 'layout' | 'crosshair' | 'timer' | 'scale' | 'swords'): string {
    const icons = {
      calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      filter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
      flag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
      target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
      shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      sliders: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="8" x2="14" y2="8"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>',
      alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      shopping: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
      rocket: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"></path><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"></path></svg>',
      layout: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
      crosshair: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>',
      timer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      scale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h18"></path></svg>',
      swords: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="20" y2="20"></line><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline><line x1="5" y1="14" x2="9" y2="18"></line></svg>'
    };
    return `<span style="display:inline-flex; align-items:center; gap:10px; vertical-align:middle;">${icons[name]}</span>`;
  }

  private initDriver() {
    this.driverObj = driver({
      showProgress: true,
      popoverClass: 'quest100-tour-popover',
      nextBtnText: this.t.t('tour.btns.next'),
      prevBtnText: this.t.t('tour.btns.prev'),
      doneBtnText: this.t.t('tour.btns.done'),
      animate: false, // Zet animaties van Driver zelf UIT voor betere precisie
    });
  }

  startEventTour() {
    this.initDriver();
    const hasEvents = !!document.querySelector('.event-card');
    const steps: DriveStep[] = [
      {
        element: '.events-header',
        popover: { title: `${this.getIcon('calendar')} ${this.t.t('tour.event.title')}</span>`, description: this.t.t('tour.event.desc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.events-header')
      },
      {
        element: '.btn-create',
        popover: { title: `${this.getIcon('plus')} ${this.t.t('tour.event.create')}</span>`, description: this.t.t('tour.event.createDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.btn-create')
      },
      {
        element: '.filter-bar',
        popover: { title: `${this.getIcon('filter')} ${this.t.t('tour.event.filter')}</span>`, description: this.t.t('tour.event.filterDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.filter-bar')
      }
    ];
    if (hasEvents) {
      steps.push({
        element: '.card-report-btn:first-child',
        popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.event.report')}</span>`, description: this.t.t('tour.event.reportDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll('.card-report-btn:first-child')
      });
    } else {
      steps.push({
        popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.event.noEventReport')}</span>`, description: this.t.t('tour.event.noEventReportDesc') }
      });
    }
    steps.push({
      element: 'app-gotcha-banner',
      popover: { title: `${this.getIcon('target')} ${this.t.t('tour.gotcha.title')}</span>`, description: this.t.t('tour.gotcha.desc'), side: "bottom", align: 'center' },
      onHighlighted: (element) => {
        const closeTour = () => { this.driverObj?.destroy(); element?.removeEventListener('click', closeTour); };
        element?.addEventListener('click', closeTour);
      },
      onHighlightStarted: () => this.safeScroll('app-gotcha-banner')
    });
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startModerationTour() {
    this.initDriver();
    const hasOpenReports = !!document.querySelector('.open-header + .column-body .report-card');
    const steps: DriveStep[] = [
      {
        element: '.header-text',
        popover: { title: `${this.getIcon('shield')} ${this.t.t('tour.mod.header')}</span>`, description: this.t.t('tour.mod.headerDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.header-text')
      },
      {
        element: '.header-right',
        popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.mod.filters')}</span>`, description: this.t.t('tour.mod.filtersDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.header-right')
      }
    ];
    if (hasOpenReports) {
      steps.push({
        element: '.column:first-child',
        popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.mod.open')}</span>`, description: this.t.t('tour.mod.openDesc'), side: "right" },
        onHighlightStarted: () => this.safeScroll('.column:first-child')
      });
    } else {
      steps.push({
        popover: { title: `${this.getIcon('check')} ${this.t.t('tour.mod.noOpen')}</span>`, description: this.t.t('tour.mod.noOpenDesc') }
      });
    }
    steps.push({
      element: '.column:last-child',
      popover: { title: `${this.getIcon('check')} ${this.t.t('tour.mod.closed')}</span>`, description: this.t.t('tour.mod.closedDesc'), side: "left" },
      onHighlightStarted: () => this.safeScroll('.column:last-child')
    });
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startAvatarTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      {
        element: '.kudos-badge',
        popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.avatar.kudos')}</span>`, description: this.t.t('tour.avatar.kudosDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.kudos-badge')
      },
      {
        element: '.preview-panel',
        popover: { title: `${this.getIcon('user')} ${this.t.t('tour.avatar.preview')}</span>`, description: this.t.t('tour.avatar.previewDesc'), side: "right" },
        onHighlightStarted: () => this.safeScroll('.preview-panel')
      },
      {
        element: '.shop-panel',
        popover: { title: `${this.getIcon('shopping')} ${this.t.t('tour.avatar.shop')}</span>`, description: this.t.t('tour.avatar.shopDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.shop-panel')
      }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startAboutTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      {
        element: '.hero-inner',
        popover: { title: `${this.getIcon('rocket')} ${this.t.t('tour.about.hero')}</span>`, description: this.t.t('tour.about.heroDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.hero-inner')
      },
      {
        element: '.hero-counters',
        popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.about.counters')}</span>`, description: this.t.t('tour.about.countersDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll('.hero-counters')
      },
      {
        element: '.app-section:first-of-type',
        popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.about.apps')}</span>`, description: this.t.t('tour.about.appsDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll('.app-section:first-of-type')
      }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startReportAwardTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      {
        element: '.report-reason-banner',
        popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.reportDetail.banner')}</span>`, description: this.t.t('tour.reportDetail.bannerDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.report-reason-banner')
      },
      {
        element: '.chat-wrap',
        popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.reportDetail.content')}</span>`, description: this.t.t('tour.reportDetail.contentDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll('.chat-wrap')
      }
    ];
    if (document.querySelector('.btn-resolve')) {
      steps.push({
        element: '.btn-resolve',
        popover: { title: `${this.getIcon('check')} ${this.t.t('tour.reportDetail.action')}</span>`, description: this.t.t('tour.reportDetail.actionDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.btn-resolve')
      });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startReportMessageTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      {
        element: '.report-reason-banner',
        popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.reportDetail.banner')}</span>`, description: this.t.t('tour.reportDetail.bannerDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.report-reason-banner')
      },
      {
        element: '.chat-body',
        popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.reportMessage.chat')}</span>`, description: this.t.t('tour.reportMessage.chatDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll('.chat-body')
      },
      {
        element: '.highlighted',
        popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.reportMessage.flagged')}</span>`, description: this.t.t('tour.reportMessage.flaggedDesc'), side: "right" },
        onHighlightStarted: () => this.safeScroll('.highlighted')
      }
    ];
    if (document.querySelector('.btn-resolve')) {
      steps.push({
        element: '.btn-resolve',
        popover: { title: `${this.getIcon('check')} ${this.t.t('tour.reportDetail.action')}</span>`, description: this.t.t('tour.reportDetail.actionDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.btn-resolve')
      });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startReportEventTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      {
        element: '.report-reason-banner',
        popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.reportDetail.banner')}</span>`, description: this.t.t('tour.reportDetail.bannerDesc'), side: "bottom" },
        onHighlightStarted: () => this.safeScroll('.report-reason-banner')
      },
      {
        element: '.top-photo',
        popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.reportEvent.photo')}</span>`, description: this.t.t('tour.reportEvent.photoDesc'), side: "right" },
        onHighlightStarted: () => this.safeScroll('.top-photo')
      },
      {
        element: '.info-grid',
        popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.reportEvent.details')}</span>`, description: this.t.t('tour.reportEvent.detailsDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.info-grid')
      }
    ];
    if (document.querySelector('.attendees-section')) {
      steps.push({
        element: '.attendees-section',
        popover: { title: `${this.getIcon('user')} ${this.t.t('tour.reportEvent.attendees')}</span>`, description: this.t.t('tour.reportEvent.attendeesDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll('.attendees-section')
      });
    }
    if (document.querySelector('.btn-resolve')) {
      steps.push({
        element: '.btn-resolve',
        popover: { title: `${this.getIcon('check')} ${this.t.t('tour.reportDetail.action')}</span>`, description: this.t.t('tour.reportDetail.actionDesc'), side: "left" },
        onHighlightStarted: () => this.safeScroll('.btn-resolve')
      });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startGotchaRulesTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.tabs', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.gotcha.tabs')}`, description: this.t.t('tour.gotcha.tabsDesc'), side: "bottom" }, onHighlightStarted: () => this.safeScroll('.tabs') },
      { element: '.rules-info-card', popover: { title: `${this.getIcon('shield')} ${this.t.t('tour.gotcha.rulesInfo')}`, description: this.t.t('tour.gotcha.rulesInfoDesc'), side: "top" }, onHighlightStarted: () => this.safeScroll('.rules-info-card') },
      { element: '.steps-list', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.gotcha.rulesSteps')}`, description: this.t.t('tour.gotcha.rulesStepsDesc'), side: "top" }, onHighlightStarted: () => this.safeScroll('.steps-list') },
      { element: '.rules-list', popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.gotcha.rulesImportant')}`, description: this.t.t('tour.gotcha.rulesImportantDesc'), side: "top" }, onHighlightStarted: () => this.safeScroll('.rules-list') }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startGotchaFeedTour() {
    this.initDriver();
    const steps: DriveStep[] = [];
    if (document.querySelector('.target-panel')) {
      steps.push({ element: '.target-panel', popover: { title: `${this.getIcon('crosshair')} ${this.t.t('tour.gotcha.target')}`, description: this.t.t('tour.gotcha.targetDesc'), side: "bottom" }, onHighlightStarted: () => this.safeScroll('.target-panel') });
    }
    if (document.querySelector('.countdown-section')) {
      steps.push({ element: '.countdown-section', popover: { title: `${this.getIcon('timer')} ${this.t.t('tour.gotcha.timer')}`, description: this.t.t('tour.gotcha.timerDesc'), side: "top" }, onHighlightStarted: () => this.safeScroll('.countdown-section') });
    }
    steps.push({ element: '.tabs', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.gotcha.tabs')}`, description: this.t.t('tour.gotcha.tabsDesc'), side: "bottom" }, onHighlightStarted: () => this.safeScroll('.tabs') });
    const feedEl = (document.querySelector('.feed-list') || document.querySelector('.feed-empty')) as HTMLElement;
    if (feedEl) {
      steps.push({
        element: feedEl,
        popover: { title: `${this.getIcon('swords')} ${this.t.t('tour.gotcha.feed')}`, description: feedEl.classList.contains('feed-list') ? this.t.t('tour.gotcha.feedDesc') : this.t.t('tour.gotcha.feedEmptyDesc'), side: "top" },
        onHighlightStarted: () => this.safeScroll(feedEl.classList.contains('feed-list') ? '.feed-list' : '.feed-empty')
      });
    }
    if (document.querySelector('.btn-submit-kill')) {
      steps.push({ element: '.btn-submit-kill', popover: { title: `${this.getIcon('swords')} ${this.t.t('tour.gotcha.submit')}`, description: this.t.t('tour.gotcha.submitDesc'), side: "left" }, onHighlightStarted: () => this.safeScroll('.btn-submit-kill') });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startGotchaReviewTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.tabs', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.gotcha.tabs')}`, description: this.t.t('tour.gotcha.tabsDesc'), side: "bottom" }, onHighlightStarted: () => this.safeScroll('.tabs') }
    ];
    if (document.querySelector('.review-card')) {
      steps.push({ element: '.review-card', popover: { title: `${this.getIcon('scale')} ${this.t.t('tour.gotcha.review')}`, description: this.t.t('tour.gotcha.reviewDesc'), side: "top" }, onHighlightStarted: () => this.safeScroll('.review-card') });
      steps.push({ element: '.card-footer.review-actions', popover: { title: `${this.getIcon('check')} ${this.t.t('tour.gotcha.reviewActions')}`, description: this.t.t('tour.gotcha.reviewActionsDesc'), side: "top" }, onHighlightStarted: () => this.safeScroll('.card-footer.review-actions') });
    } else {
      steps.push({ popover: { title: `${this.getIcon('check')} ${this.t.t('tour.gotcha.reviewEmpty')}`, description: this.t.t('tour.gotcha.reviewEmptyDesc') } });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startGotchaEndTour() {
    this.initDriver();
    const steps: DriveStep[] = [];
    if (document.querySelector('.winner-card')) steps.push({ element: '.winner-card', popover: { title: `${this.getIcon('rocket')} ${this.t.t('tour.gotchaEnd.winner')}`, description: this.t.t('tour.gotchaEnd.winnerDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.winner-card') });
    if (document.querySelector('.prize-card')) steps.push({ element: '.prize-card', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.gotchaEnd.prize')}`, description: this.t.t('tour.gotchaEnd.prizeDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.prize-card') });
    if (document.querySelector('.awards-section')) steps.push({ element: '.awards-section', popover: { title: `${this.getIcon('shield')} ${this.t.t('tour.gotchaEnd.awards')}`, description: this.t.t('tour.gotchaEnd.awardsDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.awards-section') });
    if (document.querySelector('.graph-section')) steps.push({ element: '.graph-section', popover: { title: `${this.getIcon('target')} ${this.t.t('tour.gotchaEnd.graph')}`, description: this.t.t('tour.gotchaEnd.graphDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.graph-section') });
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startGotchaHistoryTour() {
    this.initDriver();
    const steps: DriveStep[] = [{ element: '.header-title-row', popover: { title: `${this.getIcon('timer')} ${this.t.t('tour.gotchaHistory.header')}`, description: this.t.t('tour.gotchaHistory.headerDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.header-title-row') }];
    if (document.querySelector('.history-card')) {
      steps.push({ element: '.history-grid', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.gotchaHistory.grid')}`, description: this.t.t('tour.gotchaHistory.gridDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.history-grid') });
      steps.push({ element: '.history-card', popover: { title: `${this.getIcon('shield')} ${this.t.t('tour.gotchaHistory.card')}`, description: this.t.t('tour.gotchaHistory.cardDesc'), side: 'right' }, onHighlightStarted: () => this.safeScroll('.history-card') });
      steps.push({ element: '.history-card .winner-section', popover: { title: `${this.getIcon('rocket')} ${this.t.t('tour.gotchaHistory.winner')}`, description: this.t.t('tour.gotchaHistory.winnerDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.history-card .winner-section') });
      steps.push({ element: '.history-card .stats-row', popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.gotchaHistory.stats')}`, description: this.t.t('tour.gotchaHistory.statsDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.history-card .stats-row') });
      steps.push({ element: '.history-card .card-footer', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.gotchaHistory.view')}`, description: this.t.t('tour.gotchaHistory.viewDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.history-card .card-footer') });
    } else {
      steps.push({ popover: { title: `${this.getIcon('check')} ${this.t.t('tour.gotchaHistory.empty')}`, description: this.t.t('tour.gotchaHistory.emptyDesc') } });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startProfileTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.profile-picture-wrapper', popover: { title: `${this.getIcon('user')} ${this.t.t('tour.profile.picture')}`, description: this.t.t('tour.profile.pictureDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.profile-picture-wrapper') },
      { element: '.profile-actions', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.profile.actions')}`, description: this.t.t('tour.profile.actionsDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.profile-actions') },
      { element: '.profile-info', popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.profile.info')}`, description: this.t.t('tour.profile.infoDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.profile-info') }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startKudoOverviewTour() {
    this.initDriver();
    const hasEntries = !!document.querySelector('.timeline-item');
    const steps: DriveStep[] = [
      { element: '.content-card:first-of-type', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.kudoOverview.stats')}`, description: this.t.t('tour.kudoOverview.statsDesc'), side: 'right' }, onHighlightStarted: () => this.safeScroll('.content-card:first-of-type') },
      { element: '.kudo-summary', popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.kudoOverview.summary')}`, description: this.t.t('tour.kudoOverview.summaryDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.kudo-summary') },
      { element: '.stats-bars-container', popover: { title: `${this.getIcon('target')} ${this.t.t('tour.kudoOverview.bars')}`, description: this.t.t('tour.kudoOverview.barsDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.stats-bars-container') },
      { element: '.content-card:last-of-type', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.kudoOverview.timeline')}`, description: this.t.t('tour.kudoOverview.timelineDesc'), side: 'left' }, onHighlightStarted: () => this.safeScroll('.content-card:last-of-type') }
    ];
    if (hasEntries) {
      steps.push({ element: '.timeline-item', popover: { title: `${this.getIcon('check')} ${this.t.t('tour.kudoOverview.entry')}`, description: this.t.t('tour.kudoOverview.entryDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.timeline-item') });
      if (document.querySelector('.timeline-report-btn')) {
        steps.push({ element: '.timeline-report-btn', popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.kudoOverview.report')}`, description: this.t.t('tour.kudoOverview.reportDesc'), side: 'left' }, onHighlightStarted: () => this.safeScroll('.timeline-report-btn') });
      } else {
        steps.push({ popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.kudoOverview.report')}`, description: this.t.t('tour.kudoOverview.reportDescNoBtn') } });
      }
    } else {
      steps.push({ popover: { title: `${this.getIcon('check')} ${this.t.t('tour.kudoOverview.empty')}`, description: this.t.t('tour.kudoOverview.emptyDesc') } });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startEventDetailTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.top-photo', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.eventDetail.photo')}`, description: this.t.t('tour.eventDetail.photoDesc'), side: 'right' }, onHighlightStarted: () => this.safeScroll('.top-photo') },
      { element: '.top-info', popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.eventDetail.info')}`, description: this.t.t('tour.eventDetail.infoDesc'), side: 'left' }, onHighlightStarted: () => this.safeScroll('.top-info') },
      { element: '.btn-report-flag', popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.eventDetail.report')}`, description: this.t.t('tour.eventDetail.reportDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.btn-report-flag') }
    ];
    if (document.querySelector('.action-area')) steps.push({ element: '.action-area', popover: { title: `${this.getIcon('check')} ${this.t.t('tour.eventDetail.action')}`, description: this.t.t('tour.eventDetail.actionDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.action-area') });
    if (document.querySelector('.bottom-chat')) {
      steps.push({ element: '.bottom-chat', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.eventDetail.chat')}`, description: this.t.t('tour.eventDetail.chatDesc'), side: 'right' }, onHighlightStarted: () => this.safeScroll('.bottom-chat') });
    } else {
      steps.push({ popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.eventDetail.chatLocked')}`, description: this.t.t('tour.eventDetail.chatLockedDesc') } });
    }
    if (document.querySelector('.attendees-panel')) steps.push({ element: '.attendees-panel', popover: { title: `${this.getIcon('user')} ${this.t.t('tour.eventDetail.attendees')}`, description: this.t.t('tour.eventDetail.attendeesDesc'), side: 'left' }, onHighlightStarted: () => this.safeScroll('.attendees-panel') });
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startGotchaSettingsTour() {
    this.initDriver();
    const isLocked = !!document.querySelector('.settings-card--locked');
    const steps: DriveStep[] = [
      { element: '.settings-card:first-child', popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.gotchaSettings.gameCard')}`, description: isLocked ? this.t.t('tour.gotchaSettings.gameCardLocked') : this.t.t('tour.gotchaSettings.gameCardDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.settings-card:first-child') },
      { element: '.field-group--startdate', popover: { title: `${this.getIcon('calendar')} ${this.t.t('tour.gotchaSettings.startDate')}`, description: this.t.t('tour.gotchaSettings.startDateDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.field-group--startdate') },
      { element: '.field-group--deadline', popover: { title: `${this.getIcon('timer')} ${this.t.t('tour.gotchaSettings.deadline')}`, description: this.t.t('tour.gotchaSettings.deadlineDesc'), side: 'bottom' }, onHighlightStarted: () => this.safeScroll('.field-group--deadline') },
      { element: '.field-group--prize-photo', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.gotchaSettings.prize')}`, description: this.t.t('tour.gotchaSettings.prizeDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.field-group--prize-photo') },
      { element: '.field-row--prize-desc', popover: { title: `${this.getIcon('flag')} ${this.t.t('tour.gotchaSettings.prizeDesc2')}`, description: this.t.t('tour.gotchaSettings.prizeDesc2Desc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.field-row--prize-desc') },
      { element: '.settings-card:last-child', popover: { title: `${this.getIcon('shopping')} ${this.t.t('tour.gotchaSettings.props')}`, description: this.t.t('tour.gotchaSettings.propsDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.settings-card:last-child') }
    ];
    if (document.querySelector('.prop-row')) {
      steps.push({ element: '.prop-row', popover: { title: `${this.getIcon('check')} ${this.t.t('tour.gotchaSettings.propRow')}`, description: this.t.t('tour.gotchaSettings.propRowDesc'), side: 'right' }, onHighlightStarted: () => this.safeScroll('.prop-row') });
    } else {
      steps.push({ element: '.props-empty', popover: { title: `${this.getIcon('alert')} ${this.t.t('tour.gotchaSettings.noProps')}`, description: this.t.t('tour.gotchaSettings.noPropsDesc'), side: 'top' }, onHighlightStarted: () => this.safeScroll('.props-empty') });
    }
    if (!isLocked && document.querySelector('.btn-add-prop')) {
      steps.push({ element: '.btn-add-prop', popover: { title: `${this.getIcon('plus')} ${this.t.t('tour.gotchaSettings.addProp')}`, description: this.t.t('tour.gotchaSettings.addPropDesc'), side: 'left' }, onHighlightStarted: () => this.safeScroll('.btn-add-prop') });
    }
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startHomeTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.welcome-header', popover: { title: `${this.getIcon('rocket')} ${this.t.t('tour.home.welcome')}`, description: this.t.t('tour.home.welcomeDesc'), side: 'bottom', align: 'start' }, onHighlightStarted: () => this.safeScroll('.welcome-header') },
      { element: '.action-grid', popover: { title: `${this.getIcon('layout')} ${this.t.t('tour.home.platforms')}`, description: this.t.t('tour.home.platformsDesc'), side: 'bottom', align: 'center' }, onHighlightStarted: () => this.safeScroll('.action-grid') },
      { element: '.info-pill-btn', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.home.infoBtn')}`, description: this.t.t('tour.home.infoBtnDesc'), side: 'right', align: 'center' }, onHighlightStarted: () => this.safeScroll('.info-pill-btn') },
      { element: '[class*="accordion-item"]:first-of-type', popover: { title: `${this.getIcon('user')} ${this.t.t('tour.home.profile')}`, description: this.t.t('tour.home.profileDesc'), side: 'top', align: 'center' }, onHighlightStarted: () => this.safeScroll('[class*="accordion-item"]:first-of-type') },
      { element: '.games-list', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.home.minigames')}`, description: this.t.t('tour.home.minigamesDesc'), side: 'top', align: 'center' }, onHighlightStarted: () => this.safeScroll('.games-list', '[class*="accordion-item"]:first-of-type .accordion-header') },
      { element: '[class*="accordion-item"]:last-of-type', popover: { title: `${this.getIcon('calendar')} ${this.t.t('tour.home.agenda')}`, description: this.t.t('tour.home.agendaDesc'), side: 'top', align: 'center' }, onHighlightStarted: () => this.safeScroll('[class*="accordion-item"]:last-of-type') },
      { element: '.tl-wrap', popover: { title: `${this.getIcon('timer')} ${this.t.t('tour.home.timeline')}`, description: this.t.t('tour.home.timelineDesc'), side: 'top', align: 'center' }, onHighlightStarted: () => this.safeScroll('.tl-wrap', '[class*="accordion-item"]:last-of-type .accordion-header') }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startUserlistTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.header-section', popover: { title: `${this.getIcon('user')} ${this.t.t('tour.userlist.title')}`, description: this.t.t('tour.userlist.titleDesc'), side: 'bottom', align: 'start' }, onHighlightStarted: () => this.safeScroll('.header-section') },
      { element: '.leaderboard-section', popover: { title: `${this.getIcon('scale')} ${this.t.t('tour.userlist.leaderboard')}`, description: this.t.t('tour.userlist.leaderboardDesc'), side: 'bottom', align: 'center' }, onHighlightStarted: () => this.safeScroll('.leaderboard-section') },
      { element: '.filter-bar', popover: { title: `${this.getIcon('filter')} ${this.t.t('tour.userlist.filter')}`, description: this.t.t('tour.userlist.filterDesc'), side: 'bottom', align: 'center' }, onHighlightStarted: () => this.safeScroll('.filter-bar') },
      { element: '.user-grid', popover: { title: `${this.getIcon('user')} ${this.t.t('tour.userlist.grid')}`, description: this.t.t('tour.userlist.gridDesc'), side: 'top', align: 'center' }, onHighlightStarted: () => this.safeScroll('.user-grid') },
      { element: '.btn-award', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.userlist.award')}`, description: this.t.t('tour.userlist.awardDesc'), side: 'left', align: 'center' }, onHighlightStarted: () => this.safeScroll('.btn-award') }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }

  startLeaderboardTour() {
    this.initDriver();
    const steps: DriveStep[] = [
      { element: '.lb-header', popover: { title: `${this.getIcon('scale')} ${this.t.t('tour.leaderboard.title')}`, description: this.t.t('tour.leaderboard.titleDesc'), side: 'bottom', align: 'start' }, onHighlightStarted: () => this.safeScroll('.lb-header') },
      { element: '.btn-create', popover: { title: `${this.getIcon('plus')} ${this.t.t('tour.leaderboard.create')}`, description: this.t.t('tour.leaderboard.createDesc'), side: 'bottom', align: 'end' }, onHighlightStarted: () => this.safeScroll('.btn-create') },
      { element: '.filter-bar', popover: { title: `${this.getIcon('filter')} ${this.t.t('tour.leaderboard.filter')}`, description: this.t.t('tour.leaderboard.filterDesc'), side: 'bottom', align: 'center' }, onHighlightStarted: () => this.safeScroll('.filter-bar') },
      { element: '.sort-buttons', popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.leaderboard.sort')}`, description: this.t.t('tour.leaderboard.sortDesc'), side: 'bottom', align: 'center' }, onHighlightStarted: () => this.safeScroll('.sort-buttons') },
      { element: '.lb-grid', popover: { title: `${this.getIcon('zap')} ${this.t.t('tour.leaderboard.grid')}`, description: this.t.t('tour.leaderboard.gridDesc'), side: 'top', align: 'center' }, onHighlightStarted: () => this.safeScroll('.lb-grid') },
      { element: '.lb-card--active, .lb-card', popover: { title: `${this.getIcon('target')} ${this.t.t('tour.leaderboard.card')}`, description: this.t.t('tour.leaderboard.cardDesc'), side: 'right', align: 'center' }, onHighlightStarted: () => this.safeScroll(document.querySelector('.lb-card--active') ? '.lb-card--active' : '.lb-card') },
      { element: '.card-edit-btn', popover: { title: `${this.getIcon('sliders')} ${this.t.t('tour.leaderboard.edit')}`, description: this.t.t('tour.leaderboard.editDesc'), side: 'left', align: 'center' }, onHighlightStarted: () => this.safeScroll('.card-edit-btn') }
    ];
    this.driverObj?.setSteps(steps);
    this.driverObj?.drive();
  }
}
