import { inject, Injectable, signal } from '@angular/core';
import { WorkspaceMode } from './models';
import { StorageService } from './storage.service';
@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private storage = inject(StorageService);
  readonly mode = signal<WorkspaceMode>(
    this.storage.read<WorkspaceMode>(
      'scopepilot.workspace.v1',
      'api',
      (value): value is WorkspaceMode => value === 'api' || value === 'demo',
    ),
  );
  setMode(mode: WorkspaceMode): void {
    this.storage.write('scopepilot.workspace.v1', mode);
    this.mode.set(mode);
  }
}
