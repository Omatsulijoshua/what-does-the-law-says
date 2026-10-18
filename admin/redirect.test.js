import test from 'node:test';
import assert from 'node:assert/strict';
import { redirectAdminDirectory } from './redirect.js';

test('direct admin URLs redirect to the directory entry without affecting API routes', () => {
  for (const [url, expected] of [['/admin', '/admin/'], ['/admin?tab=ai', '/admin/?tab=ai']]) {
    const res = { setHeader(name, value) { this[name] = value; }, end() { this.ended = true; } };
    redirectAdminDirectory({ url }, res, () => assert.fail('admin should redirect'));
    assert.equal(res.statusCode, 308);
    assert.equal(res.Location, expected);
    assert.equal(res.ended, true);
  }
  for (const url of ['/', '/admin/', '/api/admin/login']) {
    let continued = false;
    redirectAdminDirectory({ url }, {}, () => { continued = true; });
    assert.equal(continued, true);
  }
});
