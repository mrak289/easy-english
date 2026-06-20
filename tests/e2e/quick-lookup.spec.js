import { test, expect } from '@playwright/test';
import { mockAuthUser, mockNoAuth, mockVocabularyApi, mockExplainApi } from './helpers.js';

test.describe('Quick Lookup Widget — Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
  });

  test('floating button is visible on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button[title="Quick Lookup (Ctrl+K)"]')).toBeVisible();
  });

  test('floating button is visible on vocabulary page', async ({ page }) => {
    await mockVocabularyApi(page, []);
    await page.goto('/vocabulary');
    await expect(page.locator('button[title="Quick Lookup (Ctrl+K)"]')).toBeVisible();
  });

  test('floating button is visible on reading-recall page', async ({ page }) => {
    await page.goto('/reading-recall');
    await expect(page.locator('button[title="Quick Lookup (Ctrl+K)"]')).toBeVisible();
  });
});

test.describe('Quick Lookup Widget — Modal open/close', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
  });

  test('clicking the button opens the modal', async ({ page }) => {
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
    await expect(page.getByText('Quick Word Lookup')).toBeVisible();
  });

  test('Ctrl+K opens the modal', async ({ page }) => {
    await page.click('body');
    await page.keyboard.press('Control+k');
    await expect(page.getByText('Quick Word Lookup')).toBeVisible();
  });

  test('Escape closes the modal', async ({ page }) => {
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
    await expect(page.getByText('Quick Word Lookup')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Quick Word Lookup')).not.toBeVisible();
  });

  test('clicking X button closes the modal', async ({ page }) => {
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
    await page.locator('button').filter({ has: page.locator('.fa-xmark') }).click();
    await expect(page.getByText('Quick Word Lookup')).not.toBeVisible();
  });

  test('clicking overlay closes the modal', async ({ page }) => {
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
    await expect(page.getByText('Quick Word Lookup')).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(page.getByText('Quick Word Lookup')).not.toBeVisible();
  });

  test('Ctrl+K toggles modal closed when already open', async ({ page }) => {
    await page.click('body');
    await page.keyboard.press('Control+k');
    await expect(page.getByText('Quick Word Lookup')).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.getByText('Quick Word Lookup')).not.toBeVisible();
  });
});

test.describe('Quick Lookup Widget — Form', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
  });

  test('shows input placeholder', async ({ page }) => {
    await expect(page.getByPlaceholder('Type a word or phrase...')).toBeVisible();
  });

  test('Explain button is disabled when input is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Explain' })).toBeDisabled();
  });

  test('Explain button is enabled after typing', async ({ page }) => {
    await page.getByPlaceholder('Type a word or phrase...').fill('hello');
    await expect(page.getByRole('button', { name: 'Explain' })).toBeEnabled();
  });

  test('default level is A2', async ({ page }) => {
    await expect(page.locator('select')).toHaveValue('A2');
  });

  test('level selector has all CEFR options', async ({ page }) => {
    const select = page.locator('select');
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
      await expect(select.getByRole('option', { name: level })).toHaveCount(1);
    }
  });

  test('shows Ctrl+K hint text', async ({ page }) => {
    await expect(page.getByText('Ctrl+K')).toBeVisible();
  });
});

test.describe('Quick Lookup Widget — Results (unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await mockExplainApi(page);
    await page.goto('/');
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
    await page.getByPlaceholder('Type a word or phrase...').fill('serendipity');
    await page.getByRole('button', { name: 'Explain' }).click();
  });

  test('shows word in result header', async ({ page }) => {
    await expect(page.getByText('serendipity').last()).toBeVisible();
  });

  test('shows explanation text', async ({ page }) => {
    await expect(page.getByText(/finding something good without looking for it/i)).toBeVisible();
  });

  test('shows two examples', async ({ page }) => {
    await expect(page.getByText(/It was serendipity that I met/i)).toBeVisible();
    await expect(page.getByText(/Finding that old book/i)).toBeVisible();
  });

  test('shows numbered example labels', async ({ page }) => {
    const ones = page.locator('span.text-indigo-400.font-bold', { hasText: '1.' });
    const twos = page.locator('span.text-indigo-400.font-bold', { hasText: '2.' });
    await expect(ones).toBeVisible();
    await expect(twos).toBeVisible();
  });

  test('shows sign-in prompt instead of Add button when not authenticated', async ({ page }) => {
    await expect(page.getByText(/Sign in to save to vocabulary/i)).toBeVisible();
  });

  test('sign-in prompt links to Google auth', async ({ page }) => {
    const link = page.getByRole('link', { name: /Sign in to save to vocabulary/i });
    await expect(link).toHaveAttribute('href', '/api/auth/google');
  });
});

test.describe('Quick Lookup Widget — Results (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
    await mockVocabularyApi(page, []);
    await mockExplainApi(page);
    await page.goto('/');
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
    await page.getByPlaceholder('Type a word or phrase...').fill('serendipity');
    await page.getByRole('button', { name: 'Explain' }).click();
  });

  test('shows Add to My Vocabulary button when authenticated', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add to My Vocabulary/i })).toBeVisible();
  });

  test('Add button changes to Added after clicking', async ({ page }) => {
    await page.getByRole('button', { name: /Add to My Vocabulary/i }).click();
    await expect(page.getByRole('button', { name: /Added to My Vocabulary/i })).toBeVisible();
  });

  test('Add button is disabled after clicking', async ({ page }) => {
    await page.getByRole('button', { name: /Add to My Vocabulary/i }).click();
    await expect(page.getByRole('button', { name: /Added to My Vocabulary/i })).toBeDisabled();
  });
});

test.describe('Quick Lookup Widget — Level selection', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
  });

  test('can change level to B1 and submit', async ({ page }) => {
    let capturedLevel = null;
    await page.route('/api/vocabulary/explain', async route => {
      const body = JSON.parse(route.request().postData());
      capturedLevel = body.level;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: 'test', explanation: 'A test.', examples: ['Example 1.', 'Example 2.'] }),
      });
    });

    await page.locator('select').selectOption('B1');
    await page.getByPlaceholder('Type a word or phrase...').fill('test');
    await page.getByRole('button', { name: 'Explain' }).click();
    await expect(page.getByText('A test.')).toBeVisible();
    expect(capturedLevel).toBe('B1');
  });

  test('sends A2 level by default', async ({ page }) => {
    let capturedLevel = null;
    await page.route('/api/vocabulary/explain', async route => {
      const body = JSON.parse(route.request().postData());
      capturedLevel = body.level;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: 'hello', explanation: 'A greeting.', examples: ['Hello there.', 'Say hello.'] }),
      });
    });

    await page.getByPlaceholder('Type a word or phrase...').fill('hello');
    await page.getByRole('button', { name: 'Explain' }).click();
    await expect(page.getByText('A greeting.')).toBeVisible();
    expect(capturedLevel).toBe('A2');
  });
});

test.describe('Quick Lookup Widget — Error handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await page.locator('button[title="Quick Lookup (Ctrl+K)"]').click();
  });

  test('shows error message when API fails', async ({ page }) => {
    await page.route('/api/vocabulary/explain', route =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'AI not configured' }) })
    );
    await page.getByPlaceholder('Type a word or phrase...').fill('hello');
    await page.getByRole('button', { name: 'Explain' }).click();
    await expect(page.getByText(/AI not configured/i)).toBeVisible();
  });

  test('clears previous result when typing a new word', async ({ page }) => {
    await mockExplainApi(page);
    await page.getByPlaceholder('Type a word or phrase...').fill('serendipity');
    await page.getByRole('button', { name: 'Explain' }).click();
    await expect(page.getByText(/finding something good/i)).toBeVisible();

    await page.getByPlaceholder('Type a word or phrase...').fill('new word');
    await expect(page.getByText(/finding something good/i)).not.toBeVisible();
  });
});
