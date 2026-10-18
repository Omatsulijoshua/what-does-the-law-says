import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AiUsageLimiter,
  hasUserCustomKeys,
  pruneConversations,
  pruneAllStoredChats
} from '../src/utils/aiRateLimiter.js';

test('AiUsageLimiter enforces burst rate limit and returns 429', () => {
  const limiter = new AiUsageLimiter({ rateLimitPerMinute: 3, dailyLimit: 10 });
  const client = 'test-client-1';

  assert.equal(limiter.checkLimit(client).allowed, true);
  assert.equal(limiter.checkLimit(client).allowed, true);
  assert.equal(limiter.checkLimit(client).allowed, true);

  const blocked = limiter.checkLimit(client);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.limitType, 'burst');
  assert.match(blocked.message, /asking questions too quickly/);
});

test('AiUsageLimiter enforces daily query limit and returns 429', () => {
  const limiter = new AiUsageLimiter({ rateLimitPerMinute: 10, dailyLimit: 2 });
  const client = 'test-client-2';

  assert.equal(limiter.checkLimit(client).allowed, true);
  assert.equal(limiter.checkLimit(client).allowed, true);

  const blocked = limiter.checkLimit(client);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.limitType, 'daily');
  assert.match(blocked.message, /reached the daily limit of 2 questions/);
});

test('AiUsageLimiter bypasses limits when custom keys are present', () => {
  const limiter = new AiUsageLimiter({ rateLimitPerMinute: 1, dailyLimit: 1 });
  const client = 'test-client-custom';

  assert.equal(hasUserCustomKeys({ groqApiKey: 'custom-groq-key' }), true);
  assert.equal(hasUserCustomKeys({ geminiApiKey: 'custom-gemini-key' }), true);
  assert.equal(hasUserCustomKeys({}), false);
  assert.equal(hasUserCustomKeys(null), false);

  assert.equal(limiter.checkLimit(client, { hasCustomKeys: true }).allowed, true);
  assert.equal(limiter.checkLimit(client, { hasCustomKeys: true }).allowed, true);
  assert.equal(limiter.checkLimit(client, { hasCustomKeys: true }).allowed, true);
});

test('pruneConversations deletes all old conversations beyond maximum 10', () => {
  const chats = Array.from({ length: 15 }, (_, i) => ({ id: `chat_${i}`, title: `Chat ${i}` }));
  const pruned = pruneConversations(chats, 10);

  assert.equal(pruned.length, 10);
  assert.equal(pruned[0].id, 'chat_0');
  assert.equal(pruned[9].id, 'chat_9');
});

test('pruneAllStoredChats truncates all stored account chats to max 10 in localStorage', () => {
  const store = new Map();
  const fifteenChats = JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ id: `c_${i}` })));
  const threeChats = JSON.stringify(Array.from({ length: 3 }, (_, i) => ({ id: `c_${i}` })));

  store.set('nigerian_law_user_chats_user123', fifteenChats);
  store.set('nigerian_law_guest_chats', fifteenChats);
  store.set('nigerian_law_user_chats_user456', threeChats);
  store.set('other_key', 'irrelevant');

  const mockStorage = {
    get length() { return store.size; },
    key(index) { return [...store.keys()][index]; },
    getItem(key) { return store.get(key) ?? null; },
    setItem(key, value) { store.set(key, value); }
  };

  pruneAllStoredChats(mockStorage, 10);

  const user123Chats = JSON.parse(mockStorage.getItem('nigerian_law_user_chats_user123'));
  const guestChats = JSON.parse(mockStorage.getItem('nigerian_law_guest_chats'));
  const user456Chats = JSON.parse(mockStorage.getItem('nigerian_law_user_chats_user456'));

  assert.equal(user123Chats.length, 10);
  assert.equal(guestChats.length, 10);
  assert.equal(user456Chats.length, 3);
});
