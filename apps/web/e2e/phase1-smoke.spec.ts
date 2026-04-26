import { test, expect, type Page } from '@playwright/test';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function clickButtonByLabel(page: Page, labelPattern: string) {
  await page.evaluate((pattern) => {
    const matcher = new RegExp(pattern, 'i');
    const button = Array.from(document.querySelectorAll('button')).find((candidate) => {
      const text = candidate.textContent || '';
      return matcher.test(text);
    });

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error(`Button not found for pattern: ${pattern}`);
    }

    button.click();
  }, labelPattern);
}

async function registerFreshUser(page: Page, namePrefix: string) {
  const suffix = uniqueSuffix();
  const email = `phase1-${suffix}@example.com`;
  const password = 'Password123!';

  await page.goto('/register');
  await page.getByPlaceholder('Your name').fill(`${namePrefix} ${suffix}`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Create a password').fill(password);
  await page.getByPlaceholder('Repeat your password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

async function openTextArduinoIde(page: Page) {
  await page.goto('/projects/select-language?mode=text&environment=physical');
  await expect(page.getByRole('heading', { name: 'Choose your text language' })).toBeVisible();
  await clickButtonByLabel(page, 'Arduino C\\+\\+');

  await expect(page.getByRole('heading', { name: 'Choose your board' })).toBeVisible();
  await clickButtonByLabel(page, 'Arduino Uno');

  await page.waitForURL('**/projects/ide', { timeout: 30000 });
  await expect(page.getByText('main.cpp', { exact: true })).toBeVisible();
}

async function openBlockArduinoIde(page: Page) {
  await page.goto('/projects/select-board?mode=block&environment=physical');
  await expect(page.getByRole('heading', { name: 'Choose your board' })).toBeVisible();
  await clickButtonByLabel(page, 'Arduino Uno');

  await page.waitForURL('**/projects/ide', { timeout: 30000 });
  await expect(page.getByText(/Code with blocks/i)).toBeVisible();
}

async function saveScratchProject(page: Page, projectName: string) {
  await page.getByRole('button', { name: /^Save$/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="text"]').fill(projectName);
  await dialog.getByRole('button', { name: 'Create & Save' }).click();
  await expect(dialog).toBeHidden({ timeout: 30000 });
}

async function appendCommentToMonacoEditor(page: Page, comment: string) {
  const editorSurface = page.locator('.monaco-editor .view-lines').first();
  await expect(editorSurface).toBeVisible({ timeout: 30000 });
  await editorSurface.click({ position: { x: 120, y: 20 } });
  await page.keyboard.press(process.platform === 'win32' ? 'Control+End' : 'Meta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.type(comment);
}

test.describe.configure({ mode: 'serial' });

test('Phase 1 smoke: text workflow can register, open IDE, edit, and save', async ({ page }) => {
  test.slow();
  const projectName = `Smoke Text ${uniqueSuffix()}`;

  await registerFreshUser(page, 'Phase 1 Text');
  await openTextArduinoIde(page);

  await expect(page.getByTitle('Scratch workspace')).toBeVisible();
  await appendCommentToMonacoEditor(page, '// phase 1 smoke edit');

  await saveScratchProject(page, projectName);
  await expect(page.getByText(`Project: ${projectName}`)).toBeVisible({ timeout: 30000 });
});

test('Phase 1 smoke: block workflow can register, open IDE, save, and open build output', async ({ page }) => {
  test.slow();
  const projectName = `Smoke Block ${uniqueSuffix()}`;

  await registerFreshUser(page, 'Phase 1 Block');
  await openBlockArduinoIde(page);

  await expect(page.getByText('Next step')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Starter' })).toBeVisible();
  await expect(page.getByText('Generated code')).toBeVisible();
  await saveScratchProject(page, projectName);

  await page.getByRole('button', { name: /Verify/i }).click();
  await expect(page.getByText('Build Output')).toBeVisible({ timeout: 30000 });
});





