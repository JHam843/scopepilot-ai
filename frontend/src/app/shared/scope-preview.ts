import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LIST_SECTIONS, ScopeVersion } from '../core/models';
@Component({
  selector: 'app-scope-preview',
  imports: [DatePipe],
  templateUrl: './scope-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScopePreview {
  readonly version = input.required<ScopeVersion>();
  readonly sections = LIST_SECTIONS;
}
