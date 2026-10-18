import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateStoredSettings } from '../src/utils/storageMigration.js';

test('saved chats and preferences survive a namespace change without overwriting newer data', () => {
  const items = new Map([
    ['previous_guest_chats', '[{"id":"saved-chat"}]'],
    ['previous_ai_provider', 'groq'],
    ['nigerian_law_ai_provider', 'gemini'],
    ['previous_admin_session', 'authenticated']
  ]);
  const storage = {
    get length() { return items.size; },
    key(index) { return [...items.keys()][index]; },
    getItem(key) { return items.get(key) ?? null; },
    setItem(key, value) { items.set(key, value); }
  };
  migrateStoredSettings(storage);
  migrateStoredSettings(storage);
  assert.equal(items.get('nigerian_law_guest_chats'), '[{"id":"saved-chat"}]');
  assert.equal(items.get('nigerian_law_ai_provider'), 'gemini');
  assert.equal(items.has('nigerian_law_admin_session'), false);
  assert.equal(items.get('previous_guest_chats'), '[{"id":"saved-chat"}]');
});
