import { test, expect } from '@playwright/test';
import { mockNoAuth } from './helpers.js';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
  });

  test('loads and shows brand name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SimpliLang' })).toBeVisible();
  });

  test('shows exercise type cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Start Practicing').first()).toBeVisible();
  });

  test('shows Reading Recall exercise card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Active Recall Speed Trainer')).toBeVisible();
    await expect(page.getByText('30 exercises available')).toBeVisible();
  });

  test('shows Vocabulary exercise card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('My Vocabulary')).toBeVisible();
    await expect(page.getByText('Your words')).toBeVisible();
  });

  test('shows Sign In button when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('clicking Reading Recall card navigates to /reading-recall', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Practicing' }).first().click();
    await expect(page).toHaveURL('/reading-recall');
  });

  test('clicking Vocabulary card navigates to /vocabulary', async ({ page }) => {
    await page.goto('/');
    const buttons = page.getByRole('button', { name: 'Start Practicing' });
    await buttons.nth(1).click();
    await expect(page).toHaveURL('/vocabulary');
  });

  test('clicking logo navigates back to home from another page', async ({ page }) => {
    await page.goto('/reading-recall');
    await page.getByRole('heading', { name: 'SimpliLang' }).click();
    await expect(page).toHaveURL('/');
  });

  test('shows footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/SimpliLang Learning Hub/)).toBeVisible();
  });

  test('language toggle switches to Ukrainian', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle(/Switch to Ukrainian/i).click();
    await expect(page.getByText('Почати практику').first()).toBeVisible();
  });

  test('language toggle switches back to English', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle(/Switch to Ukrainian/i).click();
    await page.getByTitle(/Перемкнути на англійську/i).click();
    await expect(page.getByText('Start Practicing').first()).toBeVisible();
  });
});
