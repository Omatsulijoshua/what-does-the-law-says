import assert from 'node:assert/strict';
import test from 'node:test';
import { hasFirebaseConfig, getAuthErrorMessage } from '../src/utils/authConfig.js';

test('Google sign-in requires complete non-placeholder Firebase configuration', () => {
  const config = { apiKey: 'test-public-key', authDomain: 'test.firebaseapp.com', projectId: 'test', appId: 'test-app' };
  assert.equal(hasFirebaseConfig(config), true);
  for (const key of Object.keys(config)) {
    assert.equal(hasFirebaseConfig({ ...config, [key]: '' }), false);
    assert.equal(hasFirebaseConfig({ ...config, [key]: 'your_firebase_value' }), false);
  }
});

test('cancelled and blocked Google pop-ups produce actionable messages', () => {
  assert.match(getAuthErrorMessage('auth/popup-blocked'), /Allow pop-ups/);
  assert.match(getAuthErrorMessage('auth/popup-closed-by-user'), /cancelled/);
  assert.match(getAuthErrorMessage('auth/unauthorized-domain'), /site address/);
  assert.doesNotMatch(getAuthErrorMessage('unknown'), /unknown/);
});
