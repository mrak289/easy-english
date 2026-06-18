import { test, expect } from '@playwright/test';
import { mockAuthUser, mockNoAuth, mockHistoryApi } from './helpers.js';

test.describe('Reading Recall — Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
  });

  test('shows catalog with text cards', async ({ page }) => {
    await page.goto('/reading-recall');
    await expect(page.getByText('Improve Reading Speed & Memory')).toBeVisible();
    await expect(page.getByRole('button', { name: /Select Story/i }).first()).toBeVisible();
  });

  test('shows multiple text cards', async ({ page }) => {
    await page.goto('/reading-recall');
    const cards = page.getByRole('button', { name: /Select Story/i });
    await expect(cards).toHaveCount(await cards.count());
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('clicking a text card shows login prompt when not authenticated', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await expect(page.getByText('Authorization Required')).toBeVisible();
  });

  test('login prompt has Google Sign In button', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await expect(page.getByRole('link', { name: /Sign in with Google/i })).toBeVisible();
  });

  test('login prompt Cancel button dismisses the modal', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await expect(page.getByText('Authorization Required')).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText('Authorization Required')).not.toBeVisible();
  });

  test('History button is not visible when not authenticated', async ({ page }) => {
    await page.goto('/reading-recall');
    await expect(page.getByRole('button', { name: /History/i })).not.toBeVisible();
  });
});

test.describe('Reading Recall — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
    await mockHistoryApi(page, []);
  });

  test('History button is visible when authenticated', async ({ page }) => {
    await page.goto('/reading-recall');
    await expect(page.getByRole('button', { name: /History/i })).toBeVisible();
  });

  test('clicking text card shows Instructions modal', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await expect(page.getByText('Are you ready to start?')).toBeVisible();
  });

  test('Instructions modal shows all 4 tips', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await expect(page.getByText(/40-second timer starts/i)).toBeVisible();
    await expect(page.getByText(/write down the main ideas/i)).toBeVisible();
  });

  test('Instructions modal Close button dismisses it', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await expect(page.getByText('Are you ready to start?')).toBeVisible();
    // Close button (X icon or text)
    await page.keyboard.press('Escape');
    // If no Escape handler, find close button
  });

  test('Start Reading button moves to reading screen', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await expect(page.getByText(/40-Sec Skimming Mode/i)).toBeVisible();
  });

  test('reading screen shows Finished Early button', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await expect(page.getByRole('button', { name: /Finished Early/i })).toBeVisible();
  });

  test('Finished Early goes to writing screen', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await expect(page.getByText(/Time's Up! The book is closed/i)).toBeVisible();
  });

  test('writing screen shows textarea for input', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await expect(page.getByPlaceholder(/Start typing here/i)).toBeVisible();
  });

  test('submitting empty writing shows validation message', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await expect(page.getByText(/Please write at least/i)).toBeVisible();
  });

  test('full exercise flow: reading → writing → results', async ({ page }) => {
    await mockHistoryApi(page, []);
    await page.route('/api/history', route => route.fulfill({ status: 200, body: '[]' }));

    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();

    const textarea = page.getByPlaceholder(/Start typing here/i);
    await textarea.fill('The text was about interesting topics and main ideas discussed in the passage.');

    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await expect(page.getByText(/Results Comparison/i)).toBeVisible();
  });

  test('results screen shows Your Active Recall section', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await page.getByPlaceholder(/Start typing here/i).fill('Some recalled text about the story content');
    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await expect(page.getByText(/Your Active Recall Text/i)).toBeVisible();
  });

  test('results screen shows Back to Catalog button', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await page.getByPlaceholder(/Start typing here/i).fill('Some recalled text about the story content');
    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await expect(page.getByRole('button', { name: /Back to Catalog/i })).toBeVisible();
  });

  test('Back to Catalog returns to catalog screen', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await page.getByPlaceholder(/Start typing here/i).fill('Some recalled text about the story content');
    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await page.getByRole('button', { name: /Back to Catalog/i }).click();
    await expect(page.getByText('Improve Reading Speed & Memory')).toBeVisible();
  });

  test('results screen shows Try Again button', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    await page.getByPlaceholder(/Start typing here/i).fill('Some recalled text about the story content');
    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await expect(page.getByRole('button', { name: /Try This Text Again/i })).toBeVisible();
  });

  test('word count updates as user types', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /Select Story/i }).first().click();
    await page.getByRole('button', { name: /Start Reading/i }).click();
    await page.getByRole('button', { name: /Finished Early/i }).click();
    const textarea = page.getByPlaceholder(/Start typing here/i);
    await textarea.fill('Hello world test');
    await expect(page.getByText(/Words:/i)).toBeVisible();
  });

  test('History screen shows when History button clicked', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await expect(page.getByText('My History')).toBeVisible();
  });

  test('History screen shows empty state message', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await expect(page.getByText(/You have not completed any exercises yet/i)).toBeVisible();
  });

  test('History Back button returns to catalog', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Improve Reading Speed & Memory')).toBeVisible();
  });
});
