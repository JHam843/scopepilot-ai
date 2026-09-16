import { inject, Injectable } from '@angular/core';
import {
  isProject,
  isScopeDocument,
  LocalScopeRecord,
  Project,
  ScopeDocument,
  ScopeVersion,
  validateScope,
} from './models';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
export function createSnapshot(
  project: Project,
  document: ScopeDocument,
  versions: ScopeVersion[],
  note: string,
): ScopeVersion {
  const errors = validateScope(document);
  if (errors.length) throw new Error(errors.join(' '));
  return structuredClone({
    project,
    document,
    note: note.trim().slice(0, 200),
    createdAtUtc: new Date().toISOString(),
    number: Math.max(0, ...versions.map((version) => version.number)) + 1,
  });
}
function isRecord(value: unknown): value is LocalScopeRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as LocalScopeRecord;
  return (
    (record.draft === null || isScopeDocument(record.draft)) &&
    Array.isArray(record.versions) &&
    record.versions.every(
      (version) =>
        Number.isInteger(version.number) &&
        version.number > 0 &&
        typeof version.note === 'string' &&
        typeof version.createdAtUtc === 'string' &&
        isProject(version.project) &&
        isScopeDocument(version.document),
    )
  );
}
@Injectable({ providedIn: 'root' })
export class ScopeStoreService {
  private storage = inject(StorageService);
  private workspace = inject(WorkspaceService);
  private key(id: string): string {
    return `scopepilot.${this.workspace.mode()}.scope.v1.${id}`;
  }
  read(id: string): LocalScopeRecord {
    return this.storage.read(this.key(id), { draft: null, versions: [] }, isRecord);
  }
  saveDraft(id: string, document: ScopeDocument): void {
    const errors = validateScope(document);
    if (errors.length) throw new Error(errors.join(' '));
    this.storage.write(this.key(id), { ...this.read(id), draft: structuredClone(document) });
  }
  saveVersion(project: Project, document: ScopeDocument, note: string): ScopeVersion {
    const record = this.read(project.id);
    if (record.versions.length >= 20)
      throw new Error(
        'This browser demo stores up to 20 versions per project. Export your versions before continuing in a new project.',
      );
    const version = createSnapshot(project, document, record.versions, note);
    this.storage.write(this.key(project.id), {
      draft: structuredClone(document),
      versions: [...record.versions, version],
    });
    return version;
  }
}
