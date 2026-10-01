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
import { execFileSync, spawnSync } from 'node:child_process';

// Run against a tarball, never repository source or workspace-linked peers.
const tarball = resolve(process.argv[2]);
const nest = process.argv[3] || '12.1.0';
// npm run exposes its JS entry point on every platform. Avoid .cmd shims and shells.
const npmCli = process.env.npm_execpath;
const npmCommand =
  npmCli && /(?:^|[\\/])npm-cli\.js$/.test(npmCli) ? [process.execPath, npmCli] : ['npm'];
if (process.platform === 'win32' && npmCommand.length === 1) {
  throw new Error('On Windows, run: npm run test:packed -- <tarball> <nest>');
}
// Nest 10.0.0 predates support for reflect-metadata 0.2 in its peer range.
const reflectMetadata = nest === '10.0.0' ? '0.1.14' : '0.2.2';
const dir = mkdtempSync(join(tmpdir(), 'nestjs-aop-consumer-'));
const run = (command, args) => execFileSync(command, args, { cwd: dir, stdio: 'inherit' });
try {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'aop-consumer', private: true }));
  run(npmCommand[0], [
    ...npmCommand.slice(1),
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarball,
    `@nestjs/common@${nest}`,
    `@nestjs/core@${nest}`,
    `reflect-metadata@${reflectMetadata}`,
    'rxjs@7.8.2',
    'jest@30.4.2',
    'jest29@npm:jest@29.7.0',
    'ts-jest@29.4.12',
    'typescript@5.8.3',
    'typescript57@npm:typescript@5.7.3',
    '@types/node@22.10.2',
  ]);
  const installedNest = JSON.parse(
    readFileSync(join(dir, 'node_modules/@nestjs/common/package.json'), 'utf8'),
  ).version;
  console.log(`Testing Nest ${installedNest} (requested ${nest}) on Node ${process.versions.node}`);
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
  } else {
    console.log('SKIP CJS Jest: this Node version requires the ESM test setup verified above');
  }
  // Exercise the exact guide configuration against the installed package, not source aliases.
  const jestConfig = readFileSync(
    new URL('./fixtures/jest-esm.config.cjs', import.meta.url),
    'utf8',
  ).replace(/\r\n/g, '\n');
  const guide = readFileSync(new URL('../docs/migrations/v3.md', import.meta.url), 'utf8').replace(
    /\r\n/g,
    '\n',
  );
  if (!guide.includes('```js\n' + jestConfig.trimEnd() + '\n```')) {
    throw new Error('The migration guide and packed ts-jest configuration must stay identical');
  }
  writeFileSync(join(dir, 'jest.guide.config.cjs'), jestConfig);
  copyFileSync(
    new URL('./fixtures/consumer-jest.ts', import.meta.url),
    join(dir, 'consumer.test.ts'),
  );
  for (const jest of ['jest29', 'jest']) {
    run(process.execPath, [
      '--experimental-vm-modules',
      `node_modules/${jest}/bin/jest.js`,
      '--config',
      'jest.guide.config.cjs',
      '--runInBand',
    ]);
  }

  // Nest 10.0.0 has upstream TS2416 errors in its file-validator declarations.
  // Keep its minimum runtime/compiler coverage without hiding errors in other peers.
  const skipLibCheck = installedNest === '10.0.0';
  if (skipLibCheck) {
    console.log('Nest 10.0.0 only: skipLibCheck=true for upstream file-validator declarations');
  }
  copyFileSync(join(dir, 'consumer-types.cts'), join(dir, 'consumer-types.ts'));
  const checkTypes = (compiler, module, files, expectedError) => {
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module,
          moduleResolution: module === 'CommonJS' ? 'Node10' : module,
          target: 'ES2022',
          noEmit: true,
          strict: true,
          skipLibCheck,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
        files,
      }),
    );
    const args = [`node_modules/${compiler}/bin/tsc`, '-p', 'tsconfig.json'];
    if (expectedError) {
      const result = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8' });
      const output = `${result.stdout || ''}${result.stderr || ''}`;
      const codes = [...output.matchAll(/error (TS\d+):/g)].map((match) => match[1]);
      if (
        result.error ||
        result.status !== 2 ||
        !codes.includes(expectedError) ||
        codes.some((code) => code !== expectedError && code !== 'TS1541') ||
        !output.includes('@toss/nestjs-aop')
      ) {
        throw new Error(`Expected ${expectedError} for ${compiler}/${module}; got:\n${output}`, {
          cause: result.error,
        });
      }
      console.log(`PASS expected ${expectedError}: ${compiler}/${module}`);
    } else {
      run(process.execPath, args);
      console.log(`PASS types: ${compiler}/${module} (${files.join(', ')})`);
    }
  };
  checkTypes('typescript', 'NodeNext', ['consumer-types.mts', 'consumer-types.cts']);
  checkTypes('typescript57', 'NodeNext', ['consumer-types.mts']);
  for (const compiler of ['typescript57', 'typescript']) {
    checkTypes(compiler, 'CommonJS', ['consumer-types.ts']);
  }
  checkTypes('typescript57', 'NodeNext', ['consumer-types.cts'], 'TS1479');
  checkTypes('typescript', 'Node16', ['consumer-types.cts'], 'TS1479');
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
  if (existsSync(join(packageDir, 'src')) || existsSync(join(packageDir, 'docs'))) {
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
  console.log(
    `PASS packed consumer: Node ${process.versions.node}, Nest ${installedNest} (${nest}), Jest 29.7.0/30.4.2, TS 5.7.3/5.8.3`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
