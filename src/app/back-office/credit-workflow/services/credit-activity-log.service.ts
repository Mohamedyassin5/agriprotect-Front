import { Injectable } from '@angular/core';

export interface ActivityEntry {
  id: string;
  label: string;
  detail?: string;
  at: string;
}

const STORAGE_KEY = 'cw_activity_v1';

@Injectable({ providedIn: 'root' })
export class CreditActivityLogService {
  private readAll(): Record<string, ActivityEntry[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, ActivityEntry[]>;
    } catch {
      return {};
    }
  }

  private writeAll(data: Record<string, ActivityEntry[]>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  append(demandeId: number, entry: Omit<ActivityEntry, 'id' | 'at'> & { at?: string }): void {
    const key = String(demandeId);
    const all = this.readAll();
    const list = all[key] ?? [];
    const full: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: entry.label,
      detail: entry.detail,
      at: entry.at ?? new Date().toISOString(),
    };
    list.unshift(full);
    all[key] = list.slice(0, 40);
    this.writeAll(all);
  }

  list(demandeId: number): ActivityEntry[] {
    return this.readAll()[String(demandeId)] ?? [];
  }
}
