/**
 * Mock an authenticated user by intercepting /api/auth/me
 */
export async function mockAuthUser(page, user = null) {
  const mockUser = user || {
    id: 1,
    name: 'Test User',
    email: 'testuser@example.com',
    avatar_url: null,
  };
  await page.route('/api/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) })
  );
}

/**
 * Mock unauthenticated state
 */
export async function mockNoAuth(page) {
  await page.route('/api/auth/me', route =>
    route.fulfill({ status: 401, body: 'Unauthorized' })
  );
}

/**
 * Mock vocabulary API
 */
export async function mockVocabularyApi(page, words = []) {
  await page.route('/api/vocabulary', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(words) });
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData());
      const newWord = {
        id: Date.now(),
        word: body.word,
        definition: `Definition of ${body.word}`,
        image_url: null,
        status: 'new',
        created_at: new Date().toISOString(),
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(newWord) });
    }
  });

  await page.route('/api/vocabulary/**', async route => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData());
      const id = parseInt(route.request().url().split('/').pop());
      const word = words.find(w => w.id === id) || { id, word: 'test', status: 'new', created_at: new Date().toISOString() };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...word, ...body }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 200 });
    }
  });
}

/**
 * Mock Quick Lookup explain API
 */
export async function mockExplainApi(page, override = {}) {
  await page.route('/api/vocabulary/explain', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        word: override.word || 'serendipity',
        explanation: override.explanation || 'Serendipity means finding something good without looking for it.',
        examples: override.examples || [
          'It was serendipity that I met my best friend on the train.',
          'Finding that old book was a happy serendipity.',
        ],
      }),
    })
  );
}

/**
 * Mock history API
 */
export async function mockHistoryApi(page, history = []) {
  await page.route('/api/history**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(history) })
  );
}
