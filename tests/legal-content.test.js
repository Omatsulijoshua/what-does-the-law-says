import assert from 'node:assert/strict';
import test from 'node:test';
import { searchLegalDatabase } from '../src/utils/legalSearch.js';
import { searchLegalDatabase as searchServer } from '../server/legalSearch.js';
import { legalData } from '../src/data/legalData.js';
import { legalData as serverData } from '../server/legalData.js';
import { formatLegalContext } from '../src/utils/legalPolicy.js';
import handler from '../api/chat.js';

test('both backends retrieve the corrected arrest guidance', () => {
  assert.equal(serverData, legalData);
  for (const search of [searchLegalDatabase, searchServer]) {
    const result = search('What are my rights under police arrest and detention?');
    const liberty = result.sources.find(source => source.id === 'const-ch4-sec35');
    assert.ok(liberty, 'personal liberty must be retrieved');
    assert.match(liberty.content, /40 kilometres/);
    assert.match(liberty.content, /capital offences/);
    assert.equal(liberty.textType, 'summary');
    assert.ok(liberty.sourceUrl.startsWith('https://osgf.gov.ng/'));
  }
});

test('Lagos rent guidance preserves the sitting/new tenant distinction', () => {
  const entry = legalData.find(source => source.id === 'lagos-tenant-sec4');
  assert.match(entry.content, /sitting monthly tenant/);
  assert.match(entry.content, /new or prospective tenant/);
  assert.doesNotMatch(entry.content, /non-domestic\/commercial/);
  assert.match(entry.reasoning, /section 1 exclusions/);
});

test('retrieval carries election review status into the model context', () => {
  for (const search of [searchLegalDatabase, searchServer]) {
    const result = search('How does BVAS voter accreditation work in elections?');
    const electionSources = result.sources.filter(source => source.act === 'Electoral Act 2022');
    assert.ok(electionSources.length);
    for (const entry of electionSources) {
      assert.equal(entry.reviewStatus, 'needs-current-law-review');
      assert.match(formatLegalContext([entry]), /needs-current-law-review/);
      assert.doesNotMatch(formatLegalContext([entry]), /Official Text:/);
    }
  }
});

test('chat endpoint sends summary policy and corrected material to the provider', async (t) => {
  let request;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'A test legal explanation.' } }] }) };
  });
  let response;
  const res = {
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { response = body; return this; }
  };
  await handler({ method: 'POST', body: {
    message: 'What are my rights under police arrest and detention?',
    aiProvider: 'openai', customKeys: { openaiApiKey: 'test-key' }
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(response.sources.some(source => source.id === 'const-ch4-sec35'));
  const prompt = request.messages.map(message => message.content).join('\n');
  assert.match(prompt, /What Does Nigerian Law Say/);
  assert.match(prompt, /40 kilometres/);
  assert.match(prompt, /Never describe a summary as exact or official/);
  assert.doesNotMatch(prompt, /Official Text:/);
});
