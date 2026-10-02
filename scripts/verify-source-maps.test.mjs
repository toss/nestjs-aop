import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { assertSourceMaps } from './verify-source-maps.mjs';

function fixture(t) {
  const dist = mkdtempSync(join(tmpdir(), 'aop-source-maps-'));
  t.after(() => rmSync(dist, { recursive: true, force: true }));
  const writeMap = (file, map) => {
    const path = join(dist, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(map));
  };
  return { dist, writeMap };
}

const validMap = {
  version: 3,
  sources: ['../src/example.ts'],
  sourcesContent: ['export const value = 1;'],
};

test('checks JavaScript maps at the root and in nested directories', (t) => {
  const { dist, writeMap } = fixture(t);
  for (const file of ['index.js.map', 'core/types.js.map', 'utils/deep/helper.js.map']) {
    writeMap(file, validMap);
  }
  assert.equal(assertSourceMaps(dist), 3);
});

test('rejects missing embedded source in a nested JavaScript map', (t) => {
  const { dist, writeMap } = fixture(t);
  writeMap('index.js.map', validMap);
  writeMap('core/types.js.map', { ...validMap, sourcesContent: [] });
  assert.throws(() => assertSourceMaps(dist), /must embed source/);
});

test('rejects absolute source paths in a nested JavaScript map', (t) => {
  const { dist, writeMap } = fixture(t);
  writeMap('utils/add-metadata.js.map', { ...validMap, sources: ['/private/source.ts'] });
  assert.throws(() => assertSourceMaps(dist), /use relative paths/);
});

test('rejects declaration maps in nested directories', (t) => {
  const { dist, writeMap } = fixture(t);
  writeMap('core/types.d.ts.map', {});
  assert.throws(() => assertSourceMaps(dist), /Declaration maps/);
});
