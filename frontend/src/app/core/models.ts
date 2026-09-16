export const STATUSES = ['Draft', 'InReview', 'Final'] as const;
export type ProjectStatus = (typeof STATUSES)[number];
export const PHASES = ['MVP', 'Phase 2', 'Phase 3'] as const;
export type Phase = (typeof PHASES)[number];
export type WorkspaceMode = 'api' | 'demo';
// Property names match the JSON returned by our ASP.NET Core controller.
export interface SaveProjectRequest {
  title: string;
  clientName: string;
  rawRequest: string;
  status: ProjectStatus;
}
export interface Project extends SaveProjectRequest {
  id: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}
export interface UserStory {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  acceptanceCriteria: string[];
  phase: Phase;
}
export const LIST_SECTIONS = [
  { key: 'goals', label: 'Goals' },
  { key: 'functionalRequirements', label: 'Functional requirements' },
  { key: 'nonFunctionalRequirements', label: 'Non-functional requirements' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'assumptions', label: 'Assumptions' },
  { key: 'risks', label: 'Risks' },
  { key: 'questions', label: 'Questions for the client' },
] as const;
export type ListSectionKey = (typeof LIST_SECTIONS)[number]['key'];
export interface ScopeDocument extends Record<ListSectionKey, string[]> {
  schemaVersion: 1;
  summary: string;
  stories: UserStory[];
  clientAnswers: string;
  estimateLow: number | null;
  estimateHigh: number | null;
  estimateNotes: string;
}
export interface ScopeVersion {
  number: number;
  createdAtUtc: string;
  note: string;
  project: Project;
  document: ScopeDocument;
}
export interface LocalScopeRecord {
  draft: ScopeDocument | null;
  versions: ScopeVersion[];
}
export interface IntakeSample extends SaveProjectRequest {
  key: string;
  category: string;
  initials: string;
  tone: string;
}
export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    ['id', 'title', 'clientName', 'rawRequest', 'createdAtUtc', 'updatedAtUtc'].every(
      (key) => typeof p[key] === 'string',
    ) && STATUSES.includes(p['status'] as ProjectStatus)
  );
}
// Validate stored data: an old schema or damaged localStorage must not crash the editor.
export function isScopeDocument(value: unknown): value is ScopeDocument {
  if (!value || typeof value !== 'object') return false;
  const d = value as Record<string, unknown>;
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
  const list = (v: unknown) => Array.isArray(v) && v.length <= 30 && v.every((x) => text(x, 2000));
  const estimate = (v: unknown) =>
    v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 3650);
  return (
    d['schemaVersion'] === 1 &&
    text(d['summary'], 4000) &&
    text(d['clientAnswers'], 4000) &&
    text(d['estimateNotes'], 2000) &&
    LIST_SECTIONS.every((section) => list(d[section.key])) &&
    estimate(d['estimateLow']) &&
    estimate(d['estimateHigh']) &&
    Array.isArray(d['stories']) &&
    d['stories'].length <= 20 &&
    d['stories'].every((story: unknown) => {
      if (!story || typeof story !== 'object') return false;
      const s = story as Record<string, unknown>;
      return (
        text(s['id'], 100) &&
        text(s['role'], 200) &&
        text(s['goal'], 600) &&
        text(s['benefit'], 600) &&
        list(s['acceptanceCriteria']) &&
        PHASES.includes(s['phase'] as Phase)
      );
    })
  );
}
export function validateScope(document: ScopeDocument): string[] {
  if (!isScopeDocument(document))
    return ['The scope contains invalid fields or exceeds the allowed size.'];
  const errors: string[] = [];
  if (!document.summary.trim()) errors.push('Add a project summary.');
  if (!document.stories.length) errors.push('Add at least one user story.');
  if (new Set(document.stories.map((story) => story.id)).size !== document.stories.length)
    errors.push('Story IDs must be unique.');
  for (const story of document.stories) {
    if (![story.role, story.goal, story.benefit].every((text) => text.trim()))
      errors.push('Complete the role, goal, and benefit for every story.');
    if (!story.acceptanceCriteria.length || story.acceptanceCriteria.some((text) => !text.trim()))
      errors.push('Every story needs non-empty acceptance criteria.');
  }
  if ((document.estimateLow === null) !== (document.estimateHigh === null))
    errors.push('Enter both estimate values, or leave both empty.');
  if (
    document.estimateLow !== null &&
    document.estimateHigh !== null &&
    document.estimateLow > document.estimateHigh
  )
    errors.push('The lower estimate cannot exceed the upper estimate.');
  return [...new Set(errors)];
}
