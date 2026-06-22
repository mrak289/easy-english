import { test, expect } from '@playwright/test';
import path from 'path';
import {
  mockAuthUser,
  mockHistoryApi,
  mockExtractTextApi,
  mockCorrectionsApi,
} from './helpers.js';

const FIXTURE_IMAGE = path.join(import.meta.dirname, 'fixtures', 'sample-text.png');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToWritingScreen(page) {
  await page.goto('/reading-recall');
  await page.getByRole('button', { name: /Select Story/i }).first().click();
  await page.getByRole('button', { name: /Start Reading/i }).click();
  await page.getByRole('button', { name: /Finished Early/i }).click();
  await expect(page.getByPlaceholder(/Start typing here/i)).toBeVisible();
}

async function goToResultsScreen(page, recallText = 'The storey was about a brave knight who fought dragons.') {
  await goToWritingScreen(page);
  await page.getByPlaceholder(/Start typing here/i).fill(recallText);
  await page.getByRole('button', { name: /Compare with Original/i }).click();
  await expect(page.getByText(/Results Comparison/i)).toBeVisible();
}

// ---------------------------------------------------------------------------
// 1. WritingScreen — photo / camera upload
// ---------------------------------------------------------------------------

test.describe('WritingScreen — Photo upload', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
    await mockHistoryApi(page, []);
  });

  test('Upload button is visible on writing screen', async ({ page }) => {
    await goToWritingScreen(page);
    await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
  });

  test('Camera button is visible on writing screen', async ({ page }) => {
    await goToWritingScreen(page);
    await expect(page.getByRole('button', { name: /Camera/i })).toBeVisible();
  });

  test('upload input accepts image/* files', async ({ page }) => {
    await goToWritingScreen(page);
    const input = page.locator('input[type="file"]:not([capture])').first();
    await expect(input).toHaveAttribute('accept', 'image/*');
  });

  test('camera input has capture="environment" attribute', async ({ page }) => {
    await goToWritingScreen(page);
    const input = page.locator('input[type="file"][capture]').first();
    await expect(input).toHaveAttribute('capture', 'environment');
  });

  test('selecting image shows extracting indicator', async ({ page }) => {
    let resolveRoute;
    await page.route('/api/ai/extract-text', () => new Promise(res => { resolveRoute = res; }));
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    const extractPromise = page.waitForSelector('text=Extracting text from image');
    await input.setInputFiles(FIXTURE_IMAGE);
    await extractPromise;
    resolveRoute?.();
  });

  test('extracted text fills the textarea', async ({ page }) => {
    await mockExtractTextApi(page, 'The brave knight rode into battle.');
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    await input.setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByPlaceholder(/Start typing here/i)).toHaveValue('The brave knight rode into battle.', { timeout: 10000 });
  });

  test('user can edit extracted text after it fills', async ({ page }) => {
    await mockExtractTextApi(page, 'The brave knight.');
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    await input.setInputFiles(FIXTURE_IMAGE);
    const textarea = page.getByPlaceholder(/Start typing here/i);
    await expect(textarea).toHaveValue('The brave knight.', { timeout: 10000 });
    await textarea.fill('The brave knight and his horse.');
    await expect(textarea).toHaveValue('The brave knight and his horse.');
  });

  test('shows error message when extraction fails', async ({ page }) => {
    await page.route('/api/ai/extract-text', route =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'No text found in the image' }) })
    );
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    await input.setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByText(/No text found in the image/i)).toBeVisible();
  });

  test('shows error when AI not configured', async ({ page }) => {
    await page.route('/api/ai/extract-text', route =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'AI not configured' }) })
    );
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    await input.setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByText(/AI not configured/i)).toBeVisible();
  });

  test('upload and camera buttons are disabled while extracting', async ({ page }) => {
    let resolveRoute;
    await page.route('/api/ai/extract-text', () => new Promise(res => { resolveRoute = res; }));
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    await input.setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByRole('button', { name: /Upload/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Camera/i })).toBeDisabled();
    resolveRoute?.();
  });

  test('extracted text allows form submission', async ({ page }) => {
    await mockExtractTextApi(page, 'A story about the forest and its animals.');
    await goToWritingScreen(page);

    const input = page.locator('input[type="file"]:not([capture])').first();
    await input.setInputFiles(FIXTURE_IMAGE);
    await expect(page.getByPlaceholder(/Start typing here/i)).toHaveValue('A story about the forest and its animals.', { timeout: 10000 });
    await page.getByRole('button', { name: /Compare with Original/i }).click();
    await expect(page.getByText(/Results Comparison/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. CorrectionsPanel — saves to history, shows results
// ---------------------------------------------------------------------------

test.describe('CorrectionsPanel — saves corrections to history', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
  });

  test('Check Grammar button is visible on results screen', async ({ page }) => {
    await mockHistoryApi(page, []);
    await goToResultsScreen(page);
    await expect(page.getByRole('button', { name: /Check Grammar/i })).toBeVisible();
  });

  test('clicking Check Grammar calls corrections API and shows no-errors message', async ({ page }) => {
    await mockHistoryApi(page, []);
    let called = false;
    await page.route('/api/ai/corrections', async route => {
      called = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ correctedText: 'The story was about a brave knight.', errors: [] }),
      });
    });
    await goToResultsScreen(page);
    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText(/No errors found/i)).toBeVisible();
    expect(called).toBe(true);
  });

  test('after Check Grammar, corrections are PATCHed to history', async ({ page }) => {
    let patchedBody = null;

    await page.route('/api/history/save', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 55 }) })
    );
    await page.route('/api/history/55', async route => {
      if (route.request().method() === 'PATCH') {
        patchedBody = JSON.parse(route.request().postData());
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await mockCorrectionsApi(page);

    await goToResultsScreen(page);
    await page.getByRole('button', { name: /Check Grammar/i }).click();

    // Wait for the highlighted error span to appear (corrections loaded)
    await expect(page.locator('span.bg-red-100', { hasText: 'storey' })).toBeVisible();

    // Wait for PATCH to fire (use waitForResponse)
    await page.waitForResponse(r => r.url().includes('/api/history/55') && r.request().method() === 'PATCH').catch(() => {});
    await page.waitForTimeout(200);

    expect(patchedBody?.corrections).toBeDefined();
    expect(patchedBody.corrections.errors).toHaveLength(1);
    expect(patchedBody.corrections.correctedText).toBeTruthy();
  });

  test('corrections are PATCHed even when no errors found', async ({ page }) => {
    let patchedBody = null;

    await page.route('/api/history/save', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 66 }) })
    );
    await page.route('/api/history/66', async route => {
      if (route.request().method() === 'PATCH') {
        patchedBody = JSON.parse(route.request().postData());
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.route('/api/ai/corrections', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ correctedText: 'Perfect text.', errors: [] }),
      })
    );

    await goToResultsScreen(page, 'Perfect text.');
    await page.getByRole('button', { name: /Check Grammar/i }).click();
    await expect(page.getByText(/No errors found/i)).toBeVisible();

    await page.waitForResponse(r => r.url().includes('/api/history/66') && r.request().method() === 'PATCH').catch(() => {});
    await page.waitForTimeout(200);

    expect(patchedBody?.corrections).toBeDefined();
    expect(patchedBody.corrections.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. HistoryScreen — loads saved corrections without requiring Check Grammar
// ---------------------------------------------------------------------------

test.describe('HistoryScreen — loads saved corrections from history', () => {
  const CORRECTIONS_DATA = {
    correctedText: 'The story was about Ross and his monkey Marcel.',
    errors: [{ original: 'storey', corrected: 'story', explanation: 'Spelling error.' }],
  };

  const SESSION_WITH_CORRECTIONS = {
    id: 10,
    text_id: 'friends-1',
    text_title: 'Friends — The One With The Monkey',
    user_recall: 'The storey was about Ross and his monkey Marcel.',
    ai_feedback: 'Good recall overall!',
    score: 7,
    criteria: JSON.stringify({ accuracy: 7, grammar: 6, detail: 7 }),
    corrections: JSON.stringify(CORRECTIONS_DATA),
    created_at: '2026-06-21T10:00:00Z',
  };

  const SESSION_WITHOUT_CORRECTIONS = {
    id: 11,
    text_id: 'friends-1',
    text_title: 'Friends — The One With The Monkey',
    user_recall: 'Ross had a monkey.',
    ai_feedback: null,
    score: null,
    criteria: null,
    corrections: null,
    created_at: '2026-06-21T11:00:00Z',
  };

  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page);
  });

  test('session with saved corrections shows them without Check Grammar button', async ({ page }) => {
    await page.route('/api/history', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([SESSION_WITH_CORRECTIONS]) })
    );
    await page.route('/api/history/10', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_WITH_CORRECTIONS) })
    );

    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await page.getByText('Friends — The One With The Monkey').click();
    await expect(page.locator('span.bg-red-100', { hasText: 'storey' })).toBeVisible();

    // Check Grammar button should NOT show (data pre-loaded from history)
    await expect(page.getByRole('button', { name: /Check Grammar/i })).not.toBeVisible();
  });

  test('session without saved corrections shows Check Grammar button', async ({ page }) => {
    await page.route('/api/history', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([SESSION_WITHOUT_CORRECTIONS]) })
    );
    await page.route('/api/history/11', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_WITHOUT_CORRECTIONS) })
    );

    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await page.getByText('Friends — The One With The Monkey').click();

    await expect(page.getByRole('button', { name: /Check Grammar/i })).toBeVisible();
  });

  test('saved corrections show corrected version text', async ({ page }) => {
    await page.route('/api/history', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([SESSION_WITH_CORRECTIONS]) })
    );
    await page.route('/api/history/10', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_WITH_CORRECTIONS) })
    );

    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await page.getByText('Friends — The One With The Monkey').click();

    await expect(page.getByText(/The story was about Ross and his monkey Marcel/i)).toBeVisible();
  });

  test('saved corrections do not re-call corrections API', async ({ page }) => {
    let apiCalled = false;
    await page.route('/api/ai/corrections', () => { apiCalled = true; });
    await page.route('/api/history', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([SESSION_WITH_CORRECTIONS]) })
    );
    await page.route('/api/history/10', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION_WITH_CORRECTIONS) })
    );

    await page.goto('/reading-recall');
    await page.getByRole('button', { name: /History/i }).click();
    await page.getByText('Friends — The One With The Monkey').click();
    await expect(page.locator('span.bg-red-100', { hasText: 'storey' })).toBeVisible();

    expect(apiCalled).toBe(false);
  });
});
