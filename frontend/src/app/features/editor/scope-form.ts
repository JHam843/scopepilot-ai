import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { LIST_SECTIONS, ListSectionKey, ScopeDocument, UserStory, Phase } from '../../core/models';
const text = (value: string, max = 6000) =>
  new FormControl(value, { nonNullable: true, validators: [Validators.maxLength(max)] });
export function storyForm(story: UserStory) {
  return new FormGroup({
    id: text(story.id, 100),
    role: text(story.role, 200),
    goal: text(story.goal, 600),
    benefit: text(story.benefit, 600),
    phase: new FormControl<Phase>(story.phase, { nonNullable: true }),
    acceptanceCriteria: new FormArray(story.acceptanceCriteria.map((value) => text(value, 2000))),
  });
}
export function scopeForm(document: ScopeDocument) {
  return new FormGroup({
    summary: text(document.summary, 4000),
    goals: text(document.goals.join('\n')),
    functionalRequirements: text(document.functionalRequirements.join('\n')),
    nonFunctionalRequirements: text(document.nonFunctionalRequirements.join('\n')),
    integrations: text(document.integrations.join('\n')),
    assumptions: text(document.assumptions.join('\n')),
    risks: text(document.risks.join('\n')),
    questions: text(document.questions.join('\n')),
    stories: new FormArray(document.stories.map(storyForm)),
    clientAnswers: text(document.clientAnswers, 4000),
    estimateLow: new FormControl<number | null>(document.estimateLow, [
      Validators.min(0),
      Validators.max(3650),
    ]),
    estimateHigh: new FormControl<number | null>(document.estimateHigh, [
      Validators.min(0),
      Validators.max(3650),
    ]),
    estimateNotes: text(document.estimateNotes, 2000),
  });
}
export function formDocument(form: ReturnType<typeof scopeForm>): ScopeDocument {
  const value = form.getRawValue();
  const lists = Object.fromEntries(
    LIST_SECTIONS.map((section) => [
      section.key,
      value[section.key]
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    ]),
  ) as Record<ListSectionKey, string[]>;
  return {
    ...lists,
    schemaVersion: 1,
    summary: value.summary,
    stories: value.stories,
    clientAnswers: value.clientAnswers,
    estimateLow: value.estimateLow,
    estimateHigh: value.estimateHigh,
    estimateNotes: value.estimateNotes,
  };
}
export function blankScope(): ScopeDocument {
  return {
    schemaVersion: 1,
    summary: '',
    goals: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    integrations: [],
    assumptions: [],
    risks: [],
    questions: [],
    stories: [],
    clientAnswers: '',
    estimateLow: null,
    estimateHigh: null,
    estimateNotes: '',
  };
}
