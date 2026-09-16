import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Project, ProjectStatus, STATUSES } from '../../core/models';
import { ProjectsService, errorMessage } from '../../core/projects.service';
import { WorkspaceService } from '../../core/workspace.service';
import { INTAKE_SAMPLES } from '../../core/samples';
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly workspace = inject(WorkspaceService);
  private api = inject(ProjectsService);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly status = signal<ProjectStatus | ''>('');
  readonly statuses = STATUSES;
  readonly samples = INTAKE_SAMPLES;
  private requestNumber = 0;
  readonly filtered = computed(() =>
    this.projects()
      .filter(
        (p) =>
          (!this.status() || p.status === this.status()) &&
          `${p.title} ${p.clientName}`.toLowerCase().includes(this.search().trim().toLowerCase()),
      )
      .sort((a, b) => b.updatedAtUtc.localeCompare(a.updatedAtUtc)),
  );
  readonly inReview = computed(() => this.projects().filter((p) => p.status === 'InReview').length);
  readonly final = computed(() => this.projects().filter((p) => p.status === 'Final').length);
  constructor() {
    effect(() => {
      this.workspace.mode();
      void this.load();
    });
  }
  async load(): Promise<void> {
    const request = ++this.requestNumber;
    this.loading.set(true);
    this.error.set('');
    this.projects.set([]);
    try {
      const projects = await this.api.list();
      if (request === this.requestNumber) this.projects.set(projects);
    } catch (error) {
      if (request === this.requestNumber) this.error.set(errorMessage(error));
    } finally {
      if (request === this.requestNumber) this.loading.set(false);
    }
  }
  statusLabel(value: ProjectStatus): string {
    return value === 'InReview' ? 'In review' : value;
  }
}
