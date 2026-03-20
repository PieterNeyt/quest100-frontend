import {Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'unixTime', standalone: true })
export class UnixTimePipe implements PipeTransform {
  transform(unix: number): string {
    return new Date(unix * 1000)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
