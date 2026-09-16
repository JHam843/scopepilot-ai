import { CanDeactivateFn } from '@angular/router';
export interface UnsavedPage {
  canLeave(): boolean;
}
export const unsavedGuard: CanDeactivateFn<UnsavedPage> = (component) => component.canLeave();
