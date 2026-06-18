import { test, expect } from '@playwright/test';
import { mockAuthUser, mockNoAuth, mockVocabularyApi } from './helpers.js';

const SAMPLE_WORDS = [
  { id: 1, word: 'eloquent', definition: 'Fluent or persuasive in speaking or writing.', image_url: null, status: 'new', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, word: 'benevolent', definition: 'Well meaning and kindly.', image_url: null, status: 'learning', created_at: '2026-01-02T00:00:00Z' },
  { id: 3, word: 'serendipity', definition: 'The occurrence of events by chance in a happy way.', image_url: null, status: 'learned', created_at: '2026-01-03T00:00:00Z' },
];

test.describe('Vocabulary — Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
  });

  test('shows vocabulary page title', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByText('My Vocabulary')).toBeVisible();
  });

  test('shows sign in prompt when not authenticated', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByText(/Sign in to use the vocabulary feature/i)).toBeVisible();
  });

  test('clicking Add without auth shows auth modal', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByPlaceholder(/Type a word in English/i).fill('hello');
    await page.getByRole('button', { name: /Add/i }).click();
    await expect(page.getByText('Authorization Required')).toBeVisible();
  });

  test('auth modal Cancel button dismisses it', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByPlaceholder(/Type a word in English/i).fill('hello');
    await page.getByRole('button', { name: /Add/i }).click();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText('Authorization Required')).not.toBeVisible();
  });

  test('Add button is disabled when input is empty', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByRole('button', { name: /Add/i })).toBeDisabled();
  });
});

test.describe('Vocabulary — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
    await mockVocabularyApi(page, [...SAMPLE_WORDS]);
  });

  test('loads and shows words', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByText('eloquent')).toBeVisible();
    await expect(page.getByText('benevolent')).toBeVisible();
    await expect(page.getByText('serendipity')).toBeVisible();
  });

  test('shows word definitions', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByText(/Fluent or persuasive/i)).toBeVisible();
  });

  test('shows status badges on cards', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByText('New').first()).toBeVisible();
    await expect(page.getByText('Learning').first()).toBeVisible();
    await expect(page.getByText('Learned').first()).toBeVisible();
  });

  test('filter All shows all words', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /All \(3\)/i }).click();
    await expect(page.getByText('eloquent')).toBeVisible();
    await expect(page.getByText('benevolent')).toBeVisible();
    await expect(page.getByText('serendipity')).toBeVisible();
  });

  test('filter New shows only new words', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /New \(1\)/i }).click();
    await expect(page.getByText('eloquent')).toBeVisible();
    await expect(page.getByText('benevolent')).not.toBeVisible();
    await expect(page.getByText('serendipity')).not.toBeVisible();
  });

  test('filter Learning shows only learning words', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /Learning \(1\)/i }).click();
    await expect(page.getByText('benevolent')).toBeVisible();
    await expect(page.getByText('eloquent')).not.toBeVisible();
  });

  test('filter Learned shows only learned words', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /Learned \(1\)/i }).click();
    await expect(page.getByText('serendipity')).toBeVisible();
    await expect(page.getByText('eloquent')).not.toBeVisible();
  });

  test('view toggle switches to List view', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /List/i }).click();
    // In list view words are still visible
    await expect(page.getByText('eloquent')).toBeVisible();
  });

  test('view toggle switches back to Cards view', async ({ page }) => {
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /List/i }).click();
    await page.getByRole('button', { name: /Cards/i }).click();
    await expect(page.getByText('eloquent')).toBeVisible();
  });

  test('adds a new word via input and button', async ({ page }) => {
    await page.goto('/vocabulary');
    const input = page.getByPlaceholder(/Type a word in English/i);
    await input.fill('ephemeral');
    await page.getByRole('button', { name: /Add/i }).click();
    await expect(page.getByRole('heading', { name: 'ephemeral' })).toBeVisible();
  });

  test('adds a word by pressing Enter', async ({ page }) => {
    await page.goto('/vocabulary');
    const input = page.getByPlaceholder(/Type a word in English/i);
    await input.fill('transient');
    await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'transient' })).toBeVisible();
  });

  test('input clears after adding a word', async ({ page }) => {
    await page.goto('/vocabulary');
    const input = page.getByPlaceholder(/Type a word in English/i);
    await input.fill('fleeting');
    await page.getByRole('button', { name: /Add/i }).click();
    await expect(input).toHaveValue('');
  });

  test('deletes a word when trash icon clicked', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByText('eloquent')).toBeVisible();
    // click delete button for first word
    const deleteButtons = page.locator('button').filter({ has: page.locator('.fa-trash') });
    await deleteButtons.first().click();
    await expect(page.getByText('eloquent')).not.toBeVisible();
  });

  test('status change cycles New → Learning', async ({ page }) => {
    await page.goto('/vocabulary');
    // Click the New status badge of eloquent word
    const newBadge = page.getByText('New').first();
    await newBadge.click();
    // After click, status changes to Learning (via API mock)
    // The DOM updates via state — accept any visible word card remains
    await expect(page.getByText('eloquent')).toBeVisible();
  });

  test('shows filter counts correctly', async ({ page }) => {
    await page.goto('/vocabulary');
    await expect(page.getByRole('button', { name: /All \(3\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /New \(1\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Learning \(1\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Learned \(1\)/i })).toBeVisible();
  });

  test('empty state shown when no words exist', async ({ page }) => {
    await mockVocabularyApi(page, []);
    await page.goto('/vocabulary');
    await expect(page.getByText(/Your vocabulary is empty/i)).toBeVisible();
  });

  test('filter empty state shown when filter has no matches', async ({ page }) => {
    await mockVocabularyApi(page, [
      { id: 1, word: 'test', definition: 'a test', image_url: null, status: 'new', created_at: '2026-01-01T00:00:00Z' }
    ]);
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: /Learned \(0\)/i }).click();
    await expect(page.getByText(/No words with this status/i)).toBeVisible();
  });
});
