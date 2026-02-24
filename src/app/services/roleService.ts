import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  roles = signal<string[]>([]);

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }
}
