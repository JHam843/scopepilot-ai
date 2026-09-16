import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function sampleWorkspace(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('scopepilot.workspace.v1', JSON.stringify('demo')),
  );
  await page.goto('/projects');
  await expect(
    page.getByRole('link', { name: 'Barber booking platform Project scope' }),
  ).toBeVisible();
}

test('completed intake, edited stories, preserved two versions, and exported the chosen snapshot', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await sampleWorkspace(page);
  await page.getByRole('link', { name: 'Create a scope', exact: false }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Use a project name between')).toBeVisible();
  await page.getByLabel('Project name').fill('Barber booking MVP');
  await page.getByLabel('Client name').fill('Downtown Barber');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .getByLabel('Client request')
    .fill('Customers should book appointments with a barber. Staff should manage their schedules.');
  await page.getByLabel('Intended users').fill('Customers and staff');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: 'Barber booking MVP' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate mock scope' }).first().click();
  await page.getByRole('button', { name: 'User stories' }).click();
  const firstGoal = page.getByLabel('I want', { exact: true }).first();
  await firstGoal.fill('book an appointment with my preferred barber');
  await page.getByRole('button', { name: 'Save version', exact: true }).click();
  await expect(page.getByText('Version 1 saved.')).toBeVisible();
  await firstGoal.fill('book and reschedule an appointment with my preferred barber');
  await page.getByRole('button', { name: 'Save version', exact: true }).click();
  await expect(page.getByText('Version 2 saved.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'User stories' }).click();
  await expect(page.getByLabel('I want', { exact: true }).first()).toHaveValue(
    'book and reschedule an appointment with my preferred barber',
  );
  await page.getByRole('link', { name: 'Version history' }).click();
  const previews = page.locator('app-scope-preview');
  await expect(previews.nth(0)).toContainText('book an appointment with my preferred barber');
  await expect(previews.nth(0)).not.toContainText('book and reschedule');
  await expect(previews.nth(1)).toContainText('book and reschedule');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download version 1' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('barber-booking-mvp-v1.md');
  const markdown = await readFile((await download.path())!, 'utf8');
  expect(markdown).toContain('book an appointment with my preferred barber');
  expect(markdown).not.toContain('book and reschedule');
  expect(pageErrors).toEqual([]);
});

test('kept the .NET error visible until the visitor explicitly chose the sample workspace', async ({
  page,
}) => {
  await page.route('**/api/projects', (route) => route.fulfill({ status: 503, body: '' }));
  await page.goto('/projects');
  await expect(page.getByRole('alert')).toContainText('API is unavailable');
  await expect(page.getByRole('button', { name: '.NET API', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Sample workspace', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Barber booking platform Project scope' }),
  ).toBeVisible();
});

test('protected unsaved edits when changing workspaces and fitted a phone screen', async ({
  page,
}) => {
  await sampleWorkspace(page);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Barber booking platform Project scope' }).click();
  await page.getByRole('button', { name: 'Generate mock scope' }).first().click();
  await expect(page.getByLabel('Project summary', { exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '.NET API', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/sample-barber$/);
  await expect(page.getByRole('button', { name: 'Sample workspace', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('handled the API create and empty update-response contract', async ({ page }) => {
  const projects: Record<string, unknown>[] = [];
  await page.route('**/api/projects**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const project = {
        ...request.postDataJSON(),
        id: '00000000-0000-4000-8000-000000000001',
        createdAtUtc: new Date().toISOString(),
        updatedAtUtc: new Date().toISOString(),
      };
      projects.push(project);
      await route.fulfill({ status: 201, json: project });
    } else if (request.method() === 'PUT') {
      Object.assign(projects[0], request.postDataJSON());
      await route.fulfill({ status: 204 });
    } else {
      await route.fulfill({
        json: request.url().endsWith('/api/projects') ? projects : projects[0],
      });
    }
  });
  await page.goto('/projects/new');
  await page.getByLabel('Project name').fill('Inventory application');
  await page.getByLabel('Client name').fill('Corner Shop');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Client request').fill('Track inventory and record stock adjustments.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: 'Inventory application' })).toBeVisible();
  await page.getByLabel('Project name').fill('Inventory MVP');
  await page.getByRole('button', { name: 'Save project details' }).click();
  await expect(page.getByRole('heading', { name: 'Inventory MVP' })).toBeVisible();
  expect(projects[0]['title']).toBe('Inventory MVP');
});
