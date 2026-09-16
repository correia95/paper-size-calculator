import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSize, mmToInches, mmToPixels, aSeriesIndex, sheetsPerSheet, encodeState, decodeState } from './paper.ts';

test('getSize returns the correct ISO 216 dimensions for A4', () => {
  assert.deepEqual(getSize('A4'), { width: 210, height: 297 });
});

test('getSize returns the correct dimensions for a US size', () => {
  assert.deepEqual(getSize('Letter'), { width: 215.9, height: 279.4 });
});

test('getSize returns null for an unknown size name', () => {
  assert.equal(getSize('A11'), null);
});

test('mmToInches divides by 25.4', () => {
  assert.ok(Math.abs(mmToInches(25.4) - 1) < 1e-9);
  assert.ok(Math.abs(mmToInches(215.9) - 8.5) < 1e-6);
});

test('mmToPixels matches the well-known A4-at-300dpi reference (2480 x 3508 px)', () => {
  assert.equal(mmToPixels(210, 300), 2480);
  assert.equal(mmToPixels(297, 300), 3508);
});

test('mmToPixels at 72 dpi rounds correctly', () => {
  assert.equal(mmToPixels(210, 72), Math.round((210 / 25.4) * 72));
});

test('aSeriesIndex extracts the numeric index from an A-series name', () => {
  assert.equal(aSeriesIndex('A0'), 0);
  assert.equal(aSeriesIndex('A4'), 4);
  assert.equal(aSeriesIndex('A10'), 10);
});

test('aSeriesIndex returns null for a non-A-series name', () => {
  assert.equal(aSeriesIndex('Letter'), null);
  assert.equal(aSeriesIndex('A11'), null);
});

test('sheetsPerSheet: an A0 sheet holds exactly 16 A4 sheets', () => {
  assert.equal(sheetsPerSheet('A0', 'A4'), 16);
});

test('sheetsPerSheet: an A4 sheet holds exactly 2 A5 sheets', () => {
  assert.equal(sheetsPerSheet('A4', 'A5'), 2);
});

test('sheetsPerSheet returns null when the "small" size is not actually smaller', () => {
  assert.equal(sheetsPerSheet('A4', 'A0'), null);
  assert.equal(sheetsPerSheet('A4', 'A4'), null);
});

test('sheetsPerSheet returns null when either size is not in the A-series', () => {
  assert.equal(sheetsPerSheet('Letter', 'A4'), null);
  assert.equal(sheetsPerSheet('A0', 'Letter'), null);
});

test('encodeState / decodeState round-trips a full scenario', () => {
  const state = { sizeName: 'A3', dpi: 300, compareSizeName: 'A5' };
  const params = encodeState(state);
  const fallback = { sizeName: 'A4', dpi: 72, compareSizeName: 'A4' };
  const decoded = decodeState(params, fallback);
  assert.deepEqual(decoded, state);
});

test('decodeState falls back safely on missing or corrupted data', () => {
  const fallback = { sizeName: 'A4', dpi: 72, compareSizeName: 'A4' };
  assert.deepEqual(decodeState(new URLSearchParams(), fallback), fallback);
  assert.deepEqual(decodeState(new URLSearchParams('d=not-valid-base64url!!!'), fallback), fallback);
});
