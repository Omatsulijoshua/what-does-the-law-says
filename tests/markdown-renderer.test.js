import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanEmDashes, stripHeadingHashes } from '../src/utils/textFormatting.js';

test('cleanEmDashes replaces em dashes and en dashes with clean punctuation', () => {
  assert.equal(cleanEmDashes('Hello — world'), 'Hello, world');
  assert.equal(cleanEmDashes('Civil rights―explained'), 'Civil rights, explained');
  assert.equal(cleanEmDashes('Sections 35 – 36'), 'Sections 35 - 36');
});

test('stripHeadingHashes removes markdown hashes from titles', () => {
  assert.equal(stripHeadingHashes('### The Applicable Law'), 'The Applicable Law');
  assert.equal(stripHeadingHashes('## Key Rights'), 'Key Rights');
  assert.equal(stripHeadingHashes('# Introduction'), 'Introduction');
});
