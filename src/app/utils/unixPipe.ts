import {ChangeDetectorRef, OnDestroy, Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'unixTime', standalone: true })
export class UnixTimePipe implements PipeTransform {
  transform(unix: number): string {
    return new Date(unix * 1000)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

@Pipe({
  name: 'countdown',
  standalone: true,
  pure: false,
})
export class CountdownPipe implements PipeTransform, OnDestroy {
  private interval?: ReturnType<typeof setInterval>;
  private lastValue = '';

  constructor(private cdr: ChangeDetectorRef) {}

  transform(_: any): string {
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.lastValue = this.getCountdown();
        this.cdr.markForCheck();
      }, 1000);
    }
    this.lastValue = this.getCountdown();
    return this.lastValue;
  }

  private getCountdown(): string {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}
