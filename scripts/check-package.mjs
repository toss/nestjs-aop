import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const destination = mkdtempSync(join(tmpdir(), 'nestjs-aop-pack-'));

try {
  const [archive] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', destination], {
      cwd: root,
      encoding: 'utf8',
    }),
  );
  assert.ok(existsSync(join(destination, archive.filename)), 'npm pack must create an archive');
  const paths = new Set(archive.files.map(({ path }) => path));
  const { exports, types } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const path of [exports.default.replace(/^\.\//, ''), types]) {
    assert.ok(paths.has(path), `Package is missing ${path}; run the build first`);
  }
  assert.ok(![...paths].some((path) => /^(?:src|docs)\//.test(path)), 'Package must be dist-only');
  const testFiles = [...paths].filter((path) =>
    /(^|\/)(?:__tests?__|type-tests|fixtures?)(\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path),
  );
  assert.deepEqual(testFiles, [], 'Package must not include tests or fixtures');
  console.log(`Verified ${paths.size} packaged files without tests or fixtures`);
} finally {
  rmSync(destination, { recursive: true, force: true });
}
