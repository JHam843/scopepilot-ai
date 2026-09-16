import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WorkspaceService } from './core/workspace.service';
import { StorageService } from './core/storage.service';
import { WorkspaceMode } from './core/models';
import { errorMessage } from './core/projects.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly workspace = inject(WorkspaceService);
  readonly storage = inject(StorageService);
  private router = inject(Router);
  readonly error = signal('');
  async switchMode(mode: WorkspaceMode): Promise<void> {
    if (mode === this.workspace.mode()) return;
    // Navigating to the URL already open returns false (a skipped navigation),
    // so only request navigation when we actually need to leave a page.
    if (this.router.url !== '/projects' && !(await this.router.navigateByUrl('/projects'))) return;
    try {
      this.workspace.setMode(mode);
      this.error.set('');
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
