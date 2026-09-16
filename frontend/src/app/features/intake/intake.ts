import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectsService, errorMessage } from '../../core/projects.service';
import { INTAKE_SAMPLES } from '../../core/samples';
import { UnsavedPage } from '../../core/unsaved.guard';
@Component({
  selector: 'app-intake',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './intake.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntakePage implements UnsavedPage {
  private fb = inject(FormBuilder).nonNullable;
  private api = inject(ProjectsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly step = signal(0);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    clientName: ['', [Validators.required, Validators.maxLength(120)]],
    rawRequest: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    users: ['', Validators.maxLength(200)],
    integrations: ['', Validators.maxLength(200)],
    constraints: ['', Validators.maxLength(400)],
  });
  constructor() {
    const sample = INTAKE_SAMPLES.find(
      (item) => item.key === this.route.snapshot.queryParamMap.get('sample'),
    );
    if (sample)
      this.form.patchValue({
        title: sample.title,
        clientName: sample.clientName,
        rawRequest: sample.rawRequest,
      });
  }
  back(): void {
    this.step.update((step) => Math.max(0, step - 1));
  }
  next(): void {
    const names =
      this.step() === 0
        ? ['title', 'clientName']
        : ['rawRequest', 'users', 'integrations', 'constraints'];
    names.forEach((name) => this.form.get(name)?.markAsTouched());
    if (names.some((name) => this.form.get(name)?.invalid)) return;
    this.step.update((step) => Math.min(2, step + 1));
    this.error.set('');
  }
  requestText(): string {
    const value = this.form.getRawValue();
    const details = [
      ['Intended users', value.users],
      ['Integrations', value.integrations],
      ['Constraints', value.constraints],
    ]
      .filter(([, text]) => text.trim())
      .map(([label, text]) => `${label}: ${text.trim()}`);
    return [value.rawRequest.trim(), ...details].join('\n\n');
  }
  async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (
      this.form.invalid ||
      !value.title.trim() ||
      !value.clientName.trim() ||
      this.requestText().length > 6000
    ) {
      this.error.set(
        'Complete all required fields and keep the combined request below 6,000 characters.',
      );
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      const project = await this.api.create({
        title: value.title.trim(),
        clientName: value.clientName.trim(),
        rawRequest: this.requestText(),
        status: 'Draft',
      });
      this.form.markAsPristine();
      this.saving.set(false);
      await this.router.navigate(['/projects', project.id]);
    } catch (error) {
      this.error.set(errorMessage(error));
      this.saving.set(false);
    }
  }
  canLeave(): boolean {
    return (
      !this.saving() &&
      (!this.form.dirty || window.confirm('Leave this intake form and discard unsaved changes?'))
    );
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.dirty || this.saving()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
