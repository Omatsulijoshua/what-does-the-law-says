/* global process */
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerAdminRoutes } from './routes.js';

function setup() {
  const routes = new Map();
  const app = {
    get(path, handler) { routes.set(`GET ${path}`, handler); },
    post(path, handler) { routes.set(`POST ${path}`, handler); }
  };
  const analyticsData = { visits: [], registrations: [], questions: [], articles: [] };
  registerAdminRoutes(app, {
    analyticsData, saveAnalytics() {}, ensureAnalyticsShape() {},
    cleanString: value => value, buildSearchGroups: () => [],
    categorizeQuestion: () => 'General', normalizeProvider: value => value,
    isConfigured: value => Boolean(value),
    DEFAULT_GEMINI_MODEL: 'test-gemini', DEFAULT_GROQ_MODEL: 'test-groq', DEFAULT_OPENAI_MODEL: 'test-openai'
  });
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  return { routes, response };
}

test('admin endpoints retain their URLs and reject invalid credentials', () => {
  const { routes, response } = setup();
  assert.equal(routes.size, 4);
  for (const route of ['POST /api/admin/login', 'POST /api/admin/publish-article', 'POST /api/admin/ai-settings']) {
    routes.get(route)({ body: {} }, response);
    assert.equal(response.statusCode, 401, route);
  }
});

test('admin login still returns analytics for configured credentials', t => {
  const oldEmail = process.env.ADMIN_EMAIL;
  const oldPassword = process.env.ADMIN_PASSWORD;
  t.after(() => {
    if (oldEmail === undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL = oldEmail;
    if (oldPassword === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = oldPassword;
  });
  process.env.ADMIN_EMAIL = 'test@example.invalid';
  process.env.ADMIN_PASSWORD = 'test-only-password';
  const { routes, response } = setup();
  routes.get('POST /api/admin/login')({ body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.stats.registeredCount, 0);
  assert.deepEqual(response.body.stats.articles, []);
});
