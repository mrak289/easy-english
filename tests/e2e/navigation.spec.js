import { test, expect } from '@playwright/test';
import { mockNoAuth, mockAuthUser } from './helpers.js';

test.describe('Navigation', () => {
  test('/ renders the home page', async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await expect(page.getByText('What would you like to practice?')).toBeVisible();
  });

  test('/reading-recall renders the catalog', async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/reading-recall');
    await expect(page.getByText('Improve Reading Speed & Memory')).toBeVisible();
  });

  test('/vocabulary renders the vocabulary page', async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/vocabulary');
    await expect(page.getByText('My Vocabulary')).toBeVisible();
  });

  test('header logo is clickable and shows brand name', async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/reading-recall');
    await expect(page.getByText('SimpliLang').first()).toBeVisible();
  });

  test('header shows language toggle button', async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await expect(page.getByTitle(/Switch to Ukrainian/i)).toBeVisible();
  });

  test('authenticated user sees name in header', async ({ page }) => {
    await mockAuthUser(page, { id: 1, name: 'Jane Doe', email: 'jane@test.com', avatar_url: null });
    await page.goto('/');
    await expect(page.getByText('Jane Doe')).toBeVisible();
  });

  test('authenticated user sees Sign Out button', async ({ page }) => {
    await mockAuthUser(page);
    await page.goto('/');
    await expect(page.getByText('Sign Out')).toBeVisible();
  });

  test('admin user sees Admin button in header', async ({ page }) => {
    await mockAuthUser(page, { id: 1, name: 'Admin User', email: 'mrak28@gmail.com', avatar_url: null });
    await page.goto('/');
    await expect(page.getByTitle('Адмін-панель')).toBeVisible();
  });

  test('admin button navigates to /admin', async ({ page }) => {
    await mockAuthUser(page, { id: 1, name: 'Admin User', email: 'mrak28@gmail.com', avatar_url: null });
    await page.goto('/');
    await page.getByRole('button', { name: /Admin/i }).click();
    await expect(page).toHaveURL('/admin');
  });

  test('Sign Out clears user session', async ({ page }) => {
    await mockAuthUser(page);
    await page.route('/api/auth/logout', route => route.fulfill({ status: 200 }));
    await page.goto('/');
    await expect(page.getByText('Sign Out')).toBeVisible();
    await page.getByText('Sign Out').click();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});
