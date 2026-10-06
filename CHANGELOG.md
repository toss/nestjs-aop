# @toss/nestjs-aop

## 3.0.0

### Major Changes

- [#65](https://github.com/toss/nestjs-aop/pull/65) [`3971571`](https://github.com/toss/nestjs-aop/commit/39715711873d22c533407a0ab93ed74772c0d2c5) Thanks [@WhiteKiwi](https://github.com/WhiteKiwi)! - Ship ESM only and require Node.js 22.12.0 or later. Drop NestJS 8 and 9 support;
  NestJS 10, 11 and 12 remain supported. The public decorator runtime API is unchanged.

  Consumers must resolve the package through its root export; undocumented `dist/*` and `src/*` deep imports are no longer exported.
  CommonJS applications can use Node's synchronous `require(esm)` support, but older
  CommonJS Jest configurations need migration to Jest ESM mode. CommonJS TypeScript
  consumers using NodeNext need TypeScript 5.8 or later; node16 does not support
  this interop. See the [migration guide](https://github.com/toss/nestjs-aop/blob/main/docs/migrations/v3.md)
  for tested Node/Jest combinations and migration instructions.

## 2.2.1

### Patch Changes

- [#66](https://github.com/toss/nestjs-aop/pull/66) [`3eb1595`](https://github.com/toss/nestjs-aop/commit/3eb1595ba57c006a24b194a7e7beffc50b47fbd3) Thanks [@WhiteKiwi](https://github.com/WhiteKiwi)! - Apply Nest's `Injectable()` decorator in `@Aspect` so aspect classes receive injectable metadata.

## 2.2.0

### Minor Changes

- [#60](https://github.com/toss/nestjs-aop/pull/60) [`a337ccf`](https://github.com/toss/nestjs-aop/commit/a337ccf746221e4fa1b8bb3224e0c1c60fc5353d) Thanks [@WhiteKiwi](https://github.com/WhiteKiwi)! - Support NestJS 12.

  `@nestjs/common` and `@nestjs/core` peer ranges now accept `^12`, so installing alongside NestJS 12 no longer fails with `ERESOLVE`. No runtime code changed — the internals this package relies on (`DiscoveryService`, `Reflector`, `InstanceWrapper`) are unchanged in v12, and the existing test suite passes against NestJS 8, 9, 10, 11 and 12.

  Note that NestJS 12 is published as ESM only while this package is published as CommonJS, so NestJS 12 users need Node.js `^20.19.0 || >=22.12.0` (versions where `require(esm)` is available). NestJS 8 - 11 users are unaffected.
