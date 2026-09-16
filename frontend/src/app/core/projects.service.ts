import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { isProject, Project, SaveProjectRequest } from './models';
import { sampleProjects } from './samples';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if ([0, 502, 503, 504].includes(error.status))
      return 'The API is unavailable. Start the .NET backend on port 5050, then retry. You can also open the sample workspace.';
    if (error.status === 404)
      return 'This project was not found. It may belong to a different workspace.';
    if (error.status === 400 && error.error?.errors)
      return (
        Object.values(error.error.errors)
          .flat()
          .filter((value) => typeof value === 'string')
          .join(' ') || 'Check the submitted fields.'
      );
    return `The request failed (${error.status}). Your unsaved changes are still available.`;
  }
  if (error instanceof Error && error.name === 'TimeoutError')
    return 'The API took too long to respond. Check the backend, then retry.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);
  private workspace = inject(WorkspaceService);
  private readonly demoKey = 'scopepilot.demo.projects.v1';
  private demoProjects(): Project[] {
    return this.storage.read(
      this.demoKey,
      sampleProjects(),
      (value): value is Project[] => Array.isArray(value) && value.every(isProject),
    );
  }
  async list(): Promise<Project[]> {
    if (this.workspace.mode() === 'demo') return this.demoProjects();
    return firstValueFrom(this.http.get<Project[]>('/api/projects').pipe(timeout(12000)));
  }
  async get(id: string): Promise<Project> {
    if (this.workspace.mode() === 'api')
      return firstValueFrom(
        this.http.get<Project>(`/api/projects/${encodeURIComponent(id)}`).pipe(timeout(12000)),
      );
    const project = this.demoProjects().find((project) => project.id === id);
    if (!project) throw new Error('This project was not found in the sample workspace.');
    return structuredClone(project);
  }
  async create(request: SaveProjectRequest): Promise<Project> {
    if (this.workspace.mode() === 'api')
      return firstValueFrom(this.http.post<Project>('/api/projects', request).pipe(timeout(12000)));
    const projects = this.demoProjects();
    if (projects.length >= 20)
      throw new Error(
        'The sample workspace allows 20 projects. Use the API workspace for more projects.',
      );
    const now = new Date().toISOString();
    const project = { ...request, id: crypto.randomUUID(), createdAtUtc: now, updatedAtUtc: now };
    this.storage.write(this.demoKey, [project, ...projects]);
    return project;
  }
  async update(id: string, request: SaveProjectRequest): Promise<Project> {
    if (this.workspace.mode() === 'api') {
      // The C# PUT endpoint returns 204, so fetch the updated record separately.
      await firstValueFrom(
        this.http
          .put<void>(`/api/projects/${encodeURIComponent(id)}`, request)
          .pipe(timeout(12000)),
      );
      return this.get(id);
    }
    const projects = this.demoProjects();
    const index = projects.findIndex((project) => project.id === id);
    if (index < 0) throw new Error('The project no longer exists.');
    const project = { ...projects[index], ...request, updatedAtUtc: new Date().toISOString() };
    projects[index] = project;
    this.storage.write(this.demoKey, projects);
    return project;
  }
}
