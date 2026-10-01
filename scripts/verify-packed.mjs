import {
  mkdtempSync,
  readFileSync,
  copyFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// Run against a tarball, never repository source or workspace-linked peers.
const tarball = resolve(process.argv[2]);
const nest = process.argv[3] || '12.1.0';
const dir = mkdtempSync(join(tmpdir(), 'nestjs-aop-consumer-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (command, args) => execFileSync(command, args, { cwd: dir, stdio: 'inherit' });
try {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'aop-consumer', private: true }));
  run(npm, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarball,
    `@nestjs/common@${nest}`,
    `@nestjs/core@${nest}`,
    'reflect-metadata@0.2.2',
    'rxjs@7.8.2',
    'jest@30.4.2',
    'typescript@5.8.3',
    '@types/node@22.10.2',
  ]);
  for (const file of ['consumer.cjs', 'consumer.mjs', 'consumer-types.mts', 'consumer-types.cts']) {
    copyFileSync(new URL(`./fixtures/${file}`, import.meta.url), join(dir, file));
  }
  run(process.execPath, ['consumer.cjs']);
  run(process.execPath, [
    '--input-type=module',
    '-e',
    "const {smoke}=await import('./consumer.mjs'); await smoke();",
  ]);
  writeFileSync(
    join(dir, 'consumer.test.mjs'),
    "import {test} from '@jest/globals';\nimport {smoke} from './consumer.mjs';\ntest('packed ESM consumer',smoke);\n",
  );
  writeFileSync(
    join(dir, 'jest.config.cjs'),
    "module.exports={testMatch:['**/consumer.test.mjs'],transform:{}};\n",
  );
  run(process.execPath, [
    '--experimental-vm-modules',
    'node_modules/jest/bin/jest.js',
    '--runInBand',
  ]);
  writeFileSync(
    join(dir, 'consumer.test.cjs'),
    "const {smoke}=require('./consumer.cjs');test('packed CJS consumer',smoke);\n",
  );
  writeFileSync(
    join(dir, 'jest.cjs.config.cjs'),
    "module.exports={testMatch:['**/consumer.test.cjs'],transform:{}};\n",
  );
  const [major, minor] = process.versions.node.split('.').map(Number);
  // Older Node/Jest combinations need the ESM test configuration above.
  if (major > 24 || (major === 24 && minor >= 9)) {
    run(process.execPath, [
      '--experimental-vm-modules',
      'node_modules/jest/bin/jest.js',
      '--config',
      'jest.cjs.config.cjs',
      '--runInBand',
    ]);
  }
  if (major < 24 || (major === 24 && minor < 9)) {
    console.log('SKIP CJS Jest: this Node version requires the ESM test setup verified above');
  }
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2022',
        noEmit: true,
        strict: true,
        skipLibCheck: false,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
      files: ['consumer-types.mts', 'consumer-types.cts'],
    }),
  );
  run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json']);
  const pkg = JSON.parse(
    readFileSync(join(dir, 'node_modules/@toss/nestjs-aop/package.json'), 'utf8'),
  );
  if (pkg.type !== 'module') {
    throw new Error('Expected the packed ESM-only package');
  }
  const packageDir = join(dir, 'node_modules/@toss/nestjs-aop');
  if (JSON.stringify(pkg.files) !== JSON.stringify(['dist'])) {
    throw new Error('Expected a dist-only publish allowlist');
  }
  if (
    existsSync(join(packageDir, 'src')) ||
    existsSync(join(packageDir, 'docs')) ||
    existsSync(join(packageDir, 'MIGRATION_V3.md'))
  ) {
    throw new Error('Repository-only files leaked into the npm tarball');
  }
  for (const file of readdirSync(join(packageDir, 'dist'))) {
    if (file.endsWith('.d.ts.map')) {
      throw new Error('Declaration maps point to unshipped source');
    }
    if (file.endsWith('.js.map')) {
      const map = JSON.parse(readFileSync(join(packageDir, 'dist', file), 'utf8'));
      if (!map.sourcesContent?.length || map.sources.some((source) => source.startsWith('/'))) {
        throw new Error('Source maps must embed source and use relative paths');
      }
    }
  }
  console.log(`PASS packed consumer: Node ${process.versions.node}, Nest ${nest}, Jest 30.4.2`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
