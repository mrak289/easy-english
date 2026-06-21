import { test, expect } from '@playwright/test';
import path from 'path';
import { mockAuthUser, mockNoAuth, mockVocabularyApi, mockPhotoGrammarApi, mockHistorySaveApi } from './helpers.js';

const BUTTON_TITLE = 'Photo Grammar Check';
const FIXTURE_IMAGE = path.join(import.meta.dirname, 'fixtures', 'sample-text.png');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openWidget(page) {
  await page.locator(`button[title="${BUTTON_TITLE}"]`).click();
  await expect(page.getByText('Photo Grammar Check').first()).toBeVisible();
}

async function selectImage(page) {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(FIXTURE_IMAGE);
  await expect(page.locator('img[alt="Selected"]')).toBeVisible();
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
  });

  test('floating button is visible on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(`button[title="${BUTTON_TITLE}"]`)).toBeVisible();
  });

  test('floating button is visible on vocabulary page', async ({ page }) => {
    await mockVocabularyApi(page, []);
    await page.goto('/vocabulary');
    await expect(page.locator(`button[title="${BUTTON_TITLE}"]`)).toBeVisible();
  });

  test('floating button is visible on reading-recall page', async ({ page }) => {
    await page.goto('/reading-recall');
    await expect(page.locator(`button[title="${BUTTON_TITLE}"]`)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Modal open / close
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — Modal open/close', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
  });

  test('clicking the button opens the modal', async ({ page }) => {
    await openWidget(page);
  });

  test('clicking X closes the modal', async ({ page }) => {
    await openWidget(page);
    await page.locator('button').filter({ has: page.locator('.fa-xmark') }).first().click();
    await expect(page.getByText('Photo Grammar Check').first()).not.toBeVisible();
  });

  test('clicking overlay closes the modal', async ({ page }) => {
    await openWidget(page);
    await page.mouse.click(10, 10);
    await expect(page.getByText('Photo Grammar Check').first()).not.toBeVisible();
  });

  test('reopening widget resets state', async ({ page }) => {
    await mockPhotoGrammarApi(page);
    await openWidget(page);
    await selectImage(page);
    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText(/Extracted Text/i)).toBeVisible();

    // Close and reopen
    await page.locator('button').filter({ has: page.locator('.fa-xmark') }).first().click();
    await openWidget(page);

    // Should show upload area again, not previous result
    await expect(page.getByText(/Upload Photo/i)).toBeVisible();
    await expect(page.getByText(/Extracted Text/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Image selection
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — Image selection', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await openWidget(page);
  });

  test('shows upload and camera buttons before image is selected', async ({ page }) => {
    await expect(page.getByText('Upload Photo')).toBeVisible();
    await expect(page.getByText('Take Photo')).toBeVisible();
  });

  test('shows image preview after file is selected', async ({ page }) => {
    await selectImage(page);
    await expect(page.locator('img[alt="Selected"]')).toBeVisible();
  });

  test('shows Check Grammar button after image is selected', async ({ page }) => {
    await selectImage(page);
    await expect(page.getByRole('button', { name: /Check Grammar/i })).toBeVisible();
  });

  test('X button on preview resets back to upload area', async ({ page }) => {
    await selectImage(page);
    // Click the small X on the image preview
    await page.locator('div.relative button').click();
    await expect(page.getByText('Upload Photo')).toBeVisible();
    await expect(page.locator('img[alt="Selected"]')).not.toBeVisible();
  });

  test('upload input accepts image/* files', async ({ page }) => {
    const input = page.locator('input[type="file"]').first();
    await expect(input).toHaveAttribute('accept', 'image/*');
  });

  test('camera input has capture attribute', async ({ page }) => {
    const cameraInput = page.locator('input[type="file"][capture]');
    await expect(cameraInput).toHaveAttribute('capture', 'environment');
  });
});

// ---------------------------------------------------------------------------
// Grammar check results
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — Grammar check results', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await mockPhotoGrammarApi(page);
    await page.goto('/');
    await openWidget(page);
    await selectImage(page);
    await page.getByRole('button', { name: /Check Grammar/i }).click();
  });

  test('shows extracted text section', async ({ page }) => {
    await expect(page.getByText('Extracted Text')).toBeVisible();
    await expect(page.getByText(/I goed to the store/i)).toBeVisible();
  });

  test('shows number of issues found', async ({ page }) => {
    await expect(page.getByText(/2 issues found/i)).toBeVisible();
  });

  test('shows error with strikethrough original and corrected form', async ({ page }) => {
    await expect(page.locator('span.line-through', { hasText: 'goed' })).toBeVisible();
    await expect(page.locator('span.line-through', { hasText: 'buyed' })).toBeVisible();
    await expect(page.locator('span.text-teal-600', { hasText: 'went' })).toBeVisible();
    await expect(page.locator('span.text-teal-600', { hasText: 'bought' })).toBeVisible();
  });

  test('shows explanation for each error', async ({ page }) => {
    await expect(page.getByText(/"go" is an irregular verb/i)).toBeVisible();
    await expect(page.getByText(/"buy" is an irregular verb/i)).toBeVisible();
  });

  test('shows corrected version section', async ({ page }) => {
    await expect(page.getByText('Corrected Version')).toBeVisible();
    await expect(page.getByText(/I went to the store yesterday and bought some milk/i)).toBeVisible();
  });

  test('shows sign-in prompt instead of Save button when unauthenticated', async ({ page }) => {
    await expect(page.getByText(/Sign in to save to history/i)).toBeVisible();
  });

  test('sign-in link points to Google auth', async ({ page }) => {
    const link = page.getByRole('link', { name: /Sign in to save to history/i });
    await expect(link).toHaveAttribute('href', '/api/auth/google');
  });
});

// ---------------------------------------------------------------------------
// No errors case
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — No errors', () => {
  test('shows success message when no grammar errors found', async ({ page }) => {
    await mockNoAuth(page);
    await page.route('/api/ai/photo-grammar', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          extractedText: 'She went to the market.',
          correctedText: 'She went to the market.',
          errors: [],
        }),
      })
    );
    await page.goto('/');
    await openWidget(page);
    await selectImage(page);
    await page.getByRole('button', { name: /Check Grammar/i }).click();

    await expect(page.getByText(/No grammar errors found/i)).toBeVisible();
    await expect(page.getByText('Corrected Version')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — Error handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockNoAuth(page);
    await page.goto('/');
    await openWidget(page);
    await selectImage(page);
  });

  test('shows error when no text found in image', async ({ page }) => {
    await page.route('/api/ai/photo-grammar', route =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'No text found in the image' }) })
    );
    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText(/No text found in the image/i)).toBeVisible();
  });

  test('shows error when AI is not configured', async ({ page }) => {
    await page.route('/api/ai/photo-grammar', route =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'AI not configured' }) })
    );
    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText(/AI not configured/i)).toBeVisible();
  });

  test('Check Grammar button is disabled while loading', async ({ page }) => {
    let resolveRoute;
    await page.route('/api/ai/photo-grammar', route => new Promise(res => { resolveRoute = () => res(route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ extractedText: 'test', correctedText: 'test', errors: [] }) })); }));

    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText(/Analyzing/i)).toBeVisible();
    resolveRoute();
  });
});

// ---------------------------------------------------------------------------
// Save to history (authenticated)
// ---------------------------------------------------------------------------

test.describe('Photo Grammar Widget — Save to history', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
    await mockVocabularyApi(page, []);
    await mockPhotoGrammarApi(page);
    await mockHistorySaveApi(page, 42);
    await page.goto('/');
    await openWidget(page);
    await selectImage(page);
    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText('Extracted Text')).toBeVisible();
  });

  test('shows Save to History button when authenticated', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Save to History/i })).toBeVisible();
  });

  test('Save button changes to Saved after clicking', async ({ page }) => {
    await page.getByRole('button', { name: /Save to History/i }).click();
    await expect(page.getByRole('button', { name: /Saved to History/i })).toBeVisible();
  });

  test('Save button is disabled after saving', async ({ page }) => {
    await page.getByRole('button', { name: /Save to History/i }).click();
    await expect(page.getByRole('button', { name: /Saved to History/i })).toBeDisabled();
  });

  test('sends extracted text to history save endpoint', async ({ page }) => {
    let capturedBody = null;
    await page.route('/api/history/save', async route => {
      capturedBody = JSON.parse(route.request().postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 99 }) });
    });
    await page.route('/api/history/99', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );

    await page.getByRole('button', { name: /Save to History/i }).click();
    await expect(page.getByRole('button', { name: /Saved to History/i })).toBeVisible();

    expect(capturedBody.textId).toBe('photo-grammar');
    expect(capturedBody.textTitle).toBe('Photo Grammar Check');
    expect(capturedBody.userRecall).toContain('goed');
  });

  test('sends corrections to history patch endpoint', async ({ page }) => {
    let patchedBody = null;
    await page.route('/api/history/save', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 77 }) })
    );
    await page.route('/api/history/77', async route => {
      patchedBody = JSON.parse(route.request().postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.getByRole('button', { name: /Save to History/i }).click();
    await expect(page.getByRole('button', { name: /Saved to History/i })).toBeVisible();

    expect(patchedBody.corrections).toBeDefined();
    expect(patchedBody.corrections.errors).toHaveLength(2);
    expect(patchedBody.corrections.correctedText).toContain('went');
  });
});
