<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://static.toss.im/tech-article-nest-js-02.png" alt="nestjs-aop" height="140">
  </a>
  <h1>@toss/nestjs-aop</h1>
  <p>Reusable decorators. NestJS dependency injection.</p>
  <p>
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version"></a>
    <a href="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml"><img src="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="https://github.com/toss/nestjs-aop/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@toss/nestjs-aop" alt="License"></a>
  </p>
  <p><a href="#installation">Install</a> · <a href="#quick-start">Quick start</a> · <a href="#documentation">Documentation</a> · <a href="https://github.com/toss/nestjs-aop/blob/main/readme_kr.md">한국어</a></p>
</div>

Wrap NestJS methods with logging, caching, retries, or your own cross-cutting logic.
Your aspect is a NestJS provider, so it can use the same injected services as the rest of your app.

- **Reusable by design** · Define an aspect once and apply it with a decorator
- **Built for NestJS** · Use dependency injection with methods, accessors, and inherited methods
- **Types when you need them** · Opt into shared method contracts with `createDecorator<T>`

## Installation

In an existing NestJS project:

```sh
npm install @toss/nestjs-aop
```

Or use `pnpm add @toss/nestjs-aop` / `yarn add @toss/nestjs-aop`.

**Supports NestJS 8–12.** With NestJS 12, use Node.js `^20.19.0 || >=22.12.0`:
NestJS 12 is ESM-only, and this CommonJS package needs Node's `require(esm)` support.
Earlier Node 20/22 versions fail with `ERR_REQUIRE_ESM`. NestJS 8–11 users are unaffected.

Keep Nest's **legacy decorator** settings in your `tsconfig.json`; enable `strict` for typed method checks:

```json
{
  "compilerOptions": {
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick start

A complete logging example, including provider registration and application startup:

```typescript
import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';

const LOG = Symbol('LOG');
const Log = () => createDecorator(LOG);

@Injectable()
@Aspect(LOG)
class LogAspect implements LazyDecorator {
  wrap({ method, methodName }: WrapParams) {
    return (...args: unknown[]) => {
      console.log(`Calling ${methodName}`);
      return method(...args);
    };
  }
}

@Injectable()
class GreetingService {
  @Log()
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}

@Module({
  imports: [AopModule],
  providers: [LogAspect, GreetingService],
})
class AppModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  console.log(app.get(GreetingService).greet('Nest'));
  await app.close();
}

void main();
```

```text
Calling greet
Hello, Nest!
```

`Log` marks the method, `LogAspect` wraps it, and `AopModule` connects them during initialization.
The original result is returned unchanged. In tests, call `await module.init()` after compiling a `TestingModule`.

## Documentation

- **[Usage guide](https://github.com/toss/nestjs-aop/blob/main/docs/en/usage.md)** · Build decorators, pass metadata, inject services, and work with accessors, inheritance, and tests
- **[Typed decorators](https://github.com/toss/nestjs-aop/blob/main/docs/en/typed-decorators.md)** · Shared contracts, original-method inference, and TypeScript's limits
- **[Migrating from v1 to v2](https://github.com/toss/nestjs-aop/blob/main/docs/migration-guide-v2.md)** · Replace `SetMetadata` with `createDecorator`

Typed method checks are optional. Existing `createDecorator(key, metadata?)` calls keep working.

## Background

- [Why we built custom decorators for NestJS](https://toss.tech/article/nestjs-custom-decorator) (Korean)
- [Related talk](https://youtu.be/VH1GTGIMHQw?t=2973) (Korean)

## Contributing

Contributions are welcome. See the [contributing guide](https://github.com/toss/nestjs-aop/blob/main/CONTRIBUTING.md) to get started.

## License

MIT © Viva Republica, Inc. See [LICENSE](https://github.com/toss/nestjs-aop/blob/main/LICENSE).

<a title="Toss" href="https://toss.im">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://static.toss.im/logos/png/4x/logo-toss-reverse.png">
    <img alt="Toss" src="https://static.toss.im/logos/png/4x/logo-toss.png" width="80">
  </picture>
</a>
