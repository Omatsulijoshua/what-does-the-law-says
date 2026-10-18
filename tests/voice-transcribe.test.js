/* global process */
import assert from 'node:assert/strict';
import test from 'node:test';
import transcribeHandler from '../api/transcribe.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    ended: false,
    body: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
  return res;
}

test('transcribe handler returns 200 for OPTIONS preflight CORS requests', async () => {
  const req = {
    method: 'OPTIONS',
    headers: {}
  };
  const res = createMockRes();

  await transcribeHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assert.equal(res.ended, true);
});

test('transcribe handler rejects non-POST requests with 405', async () => {
  const req = {
    method: 'GET',
    headers: {}
  };
  const res = createMockRes();

  await transcribeHandler(req, res);

  assert.equal(res.statusCode, 405);
  assert.match(res.body.error, /Method not allowed/);
});

test('transcribe handler returns 503 if DEEPGRAM_API_KEY is absent', async () => {
  const prevKey = process.env.DEEPGRAM_API_KEY;
  delete process.env.DEEPGRAM_API_KEY;

  try {
    const req = {
      method: 'POST',
      headers: {},
      body: { audioBase64: 'dGVzdA==' }
    };
    const res = createMockRes();

    await transcribeHandler(req, res);

    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /Deepgram API key is not configured/);
  } finally {
    if (prevKey) process.env.DEEPGRAM_API_KEY = prevKey;
  }
});

test('transcribe handler returns 400 when audioBase64 payload is missing', async () => {
  const req = {
    method: 'POST',
    headers: {
      'x-deepgram-key': 'test-temp-key'
    },
    body: {}
  };
  const res = createMockRes();

  await transcribeHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Audio payload \(audioBase64\) is required/);
});
