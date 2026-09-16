import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sampleProjects } from './samples';
import { generateMockScope } from './mock-generator';
import { createSnapshot, ScopeStoreService } from './scope-store.service';
import { validateScope } from './models';
import { proposalMarkdown } from './export';
import { ProjectsService } from './projects.service';

describe('Reviewed scope workflow', () => {
  it.each(sampleProjects())('created a valid phased scope for $title', (project) => {
    const scope = generateMockScope(project);
    expect(validateScope(scope)).toEqual([]);
    expect(new Set(scope.stories.map((story) => story.phase))).toEqual(
      new Set(['MVP', 'Phase 2', 'Phase 3']),
    );
    expect(scope.estimateLow).toBeNull();
  });

  it('kept reviewed snapshots and exports independent from later edits', () => {
    const project = sampleProjects()[0];
    const scope = generateMockScope(project);
    const originalGoal = scope.stories[0].goal;
    const version = createSnapshot(project, scope, [], 'First review');
    scope.stories[0].goal = 'A changed goal';
    project.title = 'A changed project';
    expect(version.document.stories[0].goal).toBe(originalGoal);
    expect(version.project.title).not.toBe(project.title);
    expect(proposalMarkdown(version)).toContain(originalGoal);
    expect(proposalMarkdown(version)).not.toContain('A changed goal');
    expect(createSnapshot(project, scope, [version], 'Second review').number).toBe(2);
  });

  it('rejected missing criteria and an inverted estimate', () => {
    const scope = generateMockScope(sampleProjects()[0]);
    scope.stories[0].acceptanceCriteria = [];
    scope.estimateLow = 20;
    scope.estimateHigh = 5;
    expect(validateScope(scope)).toContain('Every story needs non-empty acceptance criteria.');
    expect(validateScope(scope)).toContain('The lower estimate cannot exceed the upper estimate.');
  });

  it('escaped HTML and links supplied by a user in a Markdown export', () => {
    const project = sampleProjects()[0];
    const scope = generateMockScope(project);
    scope.summary = '<script>alert(1)</script> [link](https://example.com)';
    const markdown = proposalMarkdown(createSnapshot(project, scope, [], ''));
    expect(markdown).not.toContain('<script>');
    expect(markdown).toContain('&lt;script&gt;');
    expect(markdown).toContain('\\[link\\]');
  });
});

describe('Existing ASP.NET Core contract', () => {
  let http: HttpTestingController;
  let service: ProjectsService;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProjectsService);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('retrieved the project after PUT returned an empty 204 response', async () => {
    const project = { ...sampleProjects()[0], id: 'project-123', title: 'Updated title' };
    const request = {
      title: project.title,
      clientName: project.clientName,
      rawRequest: project.rawRequest,
      status: project.status,
    };
    const result = service.update(project.id, request);
    const put = http.expectOne('/api/projects/project-123');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(request);
    put.flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    const get = http.expectOne('/api/projects/project-123');
    expect(get.request.method).toBe('GET');
    get.flush(project);
    expect(await result).toEqual(project);
  });

  it('recovered safely from damaged browser scope data without overwriting it', () => {
    const key = 'scopepilot.api.scope.v1.project-123';
    localStorage.setItem(key, '{broken json');
    expect(TestBed.inject(ScopeStoreService).read('project-123')).toEqual({
      draft: null,
      versions: [],
    });
    expect(localStorage.getItem(key)).toBe('{broken json');
  });
});
