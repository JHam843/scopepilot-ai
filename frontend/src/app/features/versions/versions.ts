import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Project, ScopeVersion } from '../../core/models';
import { ProjectsService, errorMessage } from '../../core/projects.service';
import { ScopeStoreService } from '../../core/scope-store.service';
import { downloadProposal } from '../../core/export';
import { ScopePreview } from '../../shared/scope-preview';
@Component({
  selector: 'app-versions',
  imports: [RouterLink, FormsModule, DatePipe, ScopePreview],
  templateUrl: './versions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsPage {
  private api = inject(ProjectsService);
  private store = inject(ScopeStoreService);
  private route = inject(ActivatedRoute);
  readonly project = signal<Project | null>(null);
  readonly versions = signal<ScopeVersion[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly leftNumber = signal(0);
  readonly rightNumber = signal(0);
  readonly left = computed(() =>
    this.versions().find((version) => version.number === this.leftNumber()),
  );
  readonly right = computed(() =>
    this.versions().find((version) => version.number === this.rightNumber()),
  );
  constructor() {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const project = await this.api.get(this.route.snapshot.paramMap.get('id') ?? '');
      this.project.set(project);
      const versions = this.store.read(project.id).versions;
      this.versions.set(versions);
      this.rightNumber.set(versions.at(-1)?.number ?? 0);
      this.leftNumber.set(versions.at(-2)?.number ?? versions.at(-1)?.number ?? 0);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
  download(version: ScopeVersion): void {
    downloadProposal(version);
  }
}
