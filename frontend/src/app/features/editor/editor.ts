import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LIST_SECTIONS,
  PHASES,
  Project,
  ProjectStatus,
  ScopeVersion,
  STATUSES,
  validateScope,
} from '../../core/models';
import { ProjectsService, errorMessage } from '../../core/projects.service';
import { ScopeStoreService } from '../../core/scope-store.service';
import { clarifyingQuestions, generateMockScope } from '../../core/mock-generator';
import { downloadProposal } from '../../core/export';
import { ScopePreview } from '../../shared/scope-preview';
import { UnsavedPage } from '../../core/unsaved.guard';
import { blankScope, formDocument, scopeForm, storyForm } from './scope-form';
@Component({
  selector: 'app-editor',
  imports: [ReactiveFormsModule, RouterLink, ScopePreview, DatePipe],
  templateUrl: './editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorPage implements UnsavedPage {
  private api = inject(ProjectsService);
  private store = inject(ScopeStoreService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder).nonNullable;
  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly hasScope = signal(false);
  readonly latestVersion = signal<ScopeVersion | null>(null);
  readonly tab = signal('overview');
  readonly tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'stories', label: 'User stories' },
    { key: 'phases', label: 'Delivery plan' },
    { key: 'questions', label: 'Questions' },
    { key: 'proposal', label: 'Proposal' },
  ];
  readonly sections = LIST_SECTIONS.filter((section) => section.key !== 'questions');
  readonly phases = PHASES;
  readonly statuses = STATUSES;
  readonly versionNote = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(200)],
  });
  readonly projectForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    clientName: ['', [Validators.required, Validators.maxLength(120)]],
    rawRequest: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(6000)]],
    status: ['Draft' as ProjectStatus, Validators.required],
  });
  scope = scopeForm(blankScope());
  private generationTimes: number[] = [];
  private loadNumber = 0;
  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => void this.load(params.get('id') ?? ''));
  }
  async load(id = this.route.snapshot.paramMap.get('id') ?? ''): Promise<void> {
    const number = ++this.loadNumber;
    this.loading.set(true);
    this.error.set('');
    try {
      const project = await this.api.get(id);
      if (number !== this.loadNumber) return;
      this.project.set(project);
      this.projectForm.reset(project);
      const record = this.store.read(id);
      this.hasScope.set(!!record.draft);
      this.scope = scopeForm(record.draft ?? blankScope());
      this.latestVersion.set(record.versions.at(-1) ?? null);
    } catch (error) {
      if (number === this.loadNumber) this.error.set(errorMessage(error));
    } finally {
      if (number === this.loadNumber) this.loading.set(false);
    }
  }
  async saveProject(): Promise<void> {
    const project = this.project();
    if (!project || this.busy()) return;
    this.projectForm.markAllAsTouched();
    if (this.projectForm.invalid) {
      this.error.set(
        'Check the project fields: name 3–120 characters, client required, request 10–6,000 characters.',
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      this.project.set(await this.api.update(project.id, this.projectForm.getRawValue()));
      this.projectForm.markAsPristine();
      this.message.set('Project details saved.');
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  async generate(): Promise<void> {
    const project = this.project();
    if (!project || this.busy()) return;
    if (this.projectForm.dirty) {
      this.error.set('Save your project details before generating a scope.');
      return;
    }
    if (
      this.hasScope() &&
      !window.confirm(
        'Replace the open draft with a new mock template? Saved versions will remain available.',
      )
    )
      return;
    const now = Date.now();
    this.generationTimes = this.generationTimes.filter((time) => now - time < 60000);
    if (this.generationTimes.length >= 5) {
      this.error.set(
        'Please wait a minute. The mock generator allows five requests per minute in this editor.',
      );
      return;
    }
    this.generationTimes.push(now);
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const document = generateMockScope(project, this.scope.controls.clientAnswers.value);
      this.scope = scopeForm(document);
      this.scope.markAsDirty();
      this.hasScope.set(true);
      this.tab.set('overview');
      this.message.set('Mock scope prepared. Review the suggestions, then save your draft.');
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  saveDraft(): void {
    const project = this.project();
    if (!project || !this.hasScope()) return;
    this.error.set('');
    this.message.set('');
    try {
      const document = this.reviewedDocument();
      this.store.saveDraft(project.id, document);
      this.scope.markAsPristine();
      this.message.set('Scope draft saved in this browser.');
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
  saveVersion(): void {
    const project = this.project();
    if (!project || !this.hasScope()) return;
    this.error.set('');
    this.message.set('');
    if (this.projectForm.dirty) {
      this.error.set('Save the project details before taking a version snapshot.');
      return;
    }
    try {
      const version = this.store.saveVersion(
        project,
        this.reviewedDocument(),
        this.versionNote.value,
      );
      this.latestVersion.set(version);
      this.scope.markAsPristine();
      this.versionNote.reset('');
      this.message.set(`Version ${version.number} saved. Earlier versions are unchanged.`);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
  private reviewedDocument() {
    this.scope.markAllAsTouched();
    if (this.scope.invalid)
      throw new Error(
        'Some fields are too long or have invalid numbers. Check the highlighted fields.',
      );
    const document = formDocument(this.scope);
    const errors = validateScope(document);
    if (errors.length) throw new Error(errors.join(' '));
    return document;
  }
  addStory(): void {
    if (this.scope.controls.stories.length >= 20) {
      this.error.set('A scope can contain up to 20 stories.');
      return;
    }
    this.scope.controls.stories.push(
      storyForm({
        id: `US-${crypto.randomUUID().slice(0, 8)}`,
        role: '',
        goal: '',
        benefit: '',
        phase: 'MVP',
        acceptanceCriteria: [''],
      }),
    );
    this.scope.markAsDirty();
  }
  removeStory(index: number): void {
    this.scope.controls.stories.removeAt(index);
    this.scope.markAsDirty();
  }
  addCriterion(index: number): void {
    const criteria = this.scope.controls.stories.at(index).controls.acceptanceCriteria;
    if (criteria.length >= 10) {
      this.error.set('Use up to 10 acceptance criteria per story.');
      return;
    }
    criteria.push(
      new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    );
    this.scope.markAsDirty();
  }
  removeCriterion(story: number, criterion: number): void {
    this.scope.controls.stories.at(story).controls.acceptanceCriteria.removeAt(criterion);
    this.scope.markAsDirty();
  }
  askQuestions(): void {
    const project = this.project();
    if (!project) return;
    const existing = this.scope.controls.questions.value
      .split('\n')
      .map((text) => text.trim())
      .filter(Boolean);
    const combined = [
      ...new Set([
        ...existing,
        ...clarifyingQuestions(project, this.scope.controls.clientAnswers.value),
      ]),
    ];
    this.scope.controls.questions.setValue(combined.slice(0, 30).join('\n'));
    this.scope.markAsDirty();
    this.tab.set('questions');
    this.message.set(
      'Rule-based clarification suggestions added. Review them before sending to a client.',
    );
  }
  exportLatest(): void {
    const version = this.latestVersion();
    if (version) downloadProposal(version);
  }
  canLeave(): boolean {
    return (
      !this.busy() &&
      ((!this.scope.dirty && !this.projectForm.dirty) ||
        window.confirm('Leave this project and discard unsaved changes?'))
    );
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void {
    if (this.scope.dirty || this.projectForm.dirty || this.busy()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
