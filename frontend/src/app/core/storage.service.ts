import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly warning = signal('');
  read<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return structuredClone(fallback);
      const value: unknown = JSON.parse(raw);
      if (!validate(value)) throw new Error('Invalid saved data');
      return value;
    } catch {
      this.warning.set(
        'Some browser data could not be read. Original stored data has not been deleted. Export any accessible work before saving over it.',
      );
      return structuredClone(fallback);
    }
  }
  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new Error(
        'Your browser could not save this data. Free some browser storage or enable storage, then try again. Your open edits are still here.',
      );
    }
  }
}
