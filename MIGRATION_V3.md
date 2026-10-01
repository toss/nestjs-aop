# Migrating to v3

This is the migration guide for the proposed v3 release. The package version stays
at 2.2.0 in this implementation PR; Changesets will prepare 3.0.0 separately.

## Breaking changes

- Node.js 22.12.0 or later is required. CI tests Node 22.12.0, 24.19.0 and 26.10.0.
- NestJS 8 and 9 are no longer supported. Use v2 if you cannot upgrade yet.
- The package contains one ESM build, not separate ESM and CommonJS builds.
- Only the root entry and `@toss/nestjs-aop/package.json` are exported. Replace
  undocumented `dist/*` or `src/*` imports with imports from `@toss/nestjs-aop`.
- Older CommonJS Jest setups need migration even if the application itself runs.

NestJS 10, 11 and 12 and the existing decorator runtime API remain supported.
Package version, runtime Node version, TypeScript module mode and Jest loader
settings are independent compatibility dimensions.

## Application imports

```ts
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';
```

For an ESM TypeScript application, set `"type": "module"` in its package.json and
use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. Include `.js`
extensions in local relative imports. Preserve `experimentalDecorators` and
`emitDecoratorMetadata` for Nest's legacy decorators and dependency injection.

CommonJS applications may use `require('@toss/nestjs-aop')` on the supported Node
versions. This loads the same synchronous ESM artifact; it is not a CJS build.
Do not infer Jest compatibility from a successful native Node `require()` call.

## Jest: portable ESM setup

Configure the transformer to emit ESM and launch Jest with VM modules enabled.
For a TypeScript consumer with ts-jest, one tested configuration is:

```js
// jest.config.cjs (the .cjs extension also works in a type:module project)
module.exports = {
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
};
```

```sh
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

When local source imports use `.js` extensions but point to TypeScript source,
configure the transform/resolver for that layout. The library's source tests use
`moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }`. Do not remap package imports
to this repository's source in consumer tests: verify the installed package.

In ESM tests, import `jest` from `@jest/globals` when needed. ESM mock setup differs
from CJS `jest.mock`; review Jest's `jest.unstable_mockModule` guidance rather than
assuming existing module mocks are unchanged.

## Tested compatibility

The packed candidate is installed into independent consumers with Nest
10.4.22, 11.2.6 and 12.1.0. Each is checked on Node 22.12.0, 24.19.0 and 26.10.0.

- Native ESM and CommonJS: actual Nest application bootstrap, aspect execution,
  before/original/after ordering, return values, undecorated methods, lifecycle
  completion and repeated calls pass.
- Jest 30.4.2 ESM with `--experimental-vm-modules`: passes on all tested nodes.
- Jest 30.4.2 CJS with that flag: passes on tested Node 24/26; fails on Node 22.12.0.
  Use the ESM setup on Node 22.
- TypeScript 5.8.3 NodeNext `.mts` and `.cts` consumer checks pass with
  `skipLibCheck: false`, including decorator metadata settings.

- With Nest 11.2.6, ts-jest 29.4.12 and Node 24.19.0, Jest 29.7.0 CJS fails
  even with the VM flag; switching its transformer/test mode to ESM passes.
  Jest 30.4.2 CJS and ESM configurations pass with the same VM flag.

These are exact tested versions, not a claim that every earlier Jest or
TypeScript version works. The same VM flag is required for the tested newer CJS
Jest configuration. A default CJS Jest command without it is not supported here.

The compatibility CI installs the tarball and independent peer dependencies,
not symlinked workspace source. Run the same check after building:

```sh
pnpm pack --out /tmp/nestjs-aop.tgz
node scripts/verify-packed.mjs /tmp/nestjs-aop.tgz 12.1.0
```

## v2.2.0 baseline and release ordering

Before this migration, the published npm 2.2.0 package was installed with Nest
12.1.0 in a fresh consumer. Native CJS and ESM apps passed on Node 24.19.0.
Jest 30.4.2 CJS passed with the VM flag. Its ESM static-import consumer hit a Jest
mixed CJS/ESM loader error; sequentially awaiting imports of `@nestjs/common` and
`@nestjs/core` before dynamically importing the consumer avoided that error.
The v3 packed ESM artifact passes the static-import ESM Jest fixture directly.

Merge and publish v3 only after reviewing the compatibility policy and migration
cost. This draft is independent of the typed-decorator PR #63. If #63 merges first,
rebase this branch and rerun packed-consumer tests before release. Do not merge
unreleased minor and major Changesets expecting two separate npm versions.

## References

- [Node require(esm)](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require)
- [TypeScript NodeNext format detection](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-format-detection)
- [Jest ESM and require(esm)](https://jestjs.io/docs/30.4/ecmascript-modules)
