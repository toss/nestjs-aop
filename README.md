<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://static.toss.im/tech-article-nest-js-02.png" alt="Logo" height="200">
  </a>

  <h2>@toss/nestjs-aop</h2>

  <p align="center">
    A way to gracefully apply AOP to NestJS.
    <br>
    Use NestJS managed instances in any decorators gracefully.
  </p>

  <p align="center">
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version"></a>
    <a href="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml"><img src="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://img.shields.io/npm/types/@toss/nestjs-aop" alt="types"></a>
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://img.shields.io/npm/dm/@toss/nestjs-aop.svg" alt="downloads"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@toss/nestjs-aop" alt="license"></a>
    <a href="https://github.com/toss/nestjs-aop/stargazers"><img src="https://img.shields.io/github/stars/toss/nestjs-aop?style=social" alt="stars"></a>
  </p>
</div>

<br>

English | [한국어](https://github.com/toss/nestjs-aop/blob/main/readme_kr.md)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#features">Features</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#quick-start">Quick Start</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#typed-method-decorators">Typed method decorators</a></li>
    <li><a href="#getter-setter-and-inheritance-support">Getter, Setter and Inheritance Support</a></li>
    <li><a href="#caveats">Caveats</a></li>
    <li><a href="#references">References</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

<!-- FEATURES -->

## Features

- 🎯 **Decorator-based AOP** — wrap any method, getter, or setter with reusable cross-cutting logic (caching, logging, retries, ...)
- 🧩 **Plays nice with the IoC container** — your aspect is a regular NestJS provider, so `@Inject` anything you need
- 🪶 **Zero runtime magic** — built on native decorators + `reflect-metadata`, no code transformation step
- ✅ **NestJS 8 → 12** — one package, no major-version treadmill
- 🧬 **Inheritance-aware** — decorated methods keep working when called through a subclass

<!-- INSTALLATION -->

## Installation

```sh
npm install @toss/nestjs-aop
pnpm add @toss/nestjs-aop
yarn add @toss/nestjs-aop
```

> **Using NestJS 12?** NestJS 12 ships as ESM only, while this package is published as CommonJS.
> Loading it therefore relies on Node's `require(esm)` support, so NestJS 12 users need
> **Node.js `^20.19.0 || >=22.12.0`**. On Node 20.x below 20.19.0 or Node 22.x below 22.12.0, the import fails with `ERR_REQUIRE_ESM`.
> NestJS 8 - 11 users are unaffected.

<!-- QUICK START -->

## Quick Start

```typescript
export const CACHE = Symbol('CACHE');
export const Cache = (options?: CacheOptions) => createDecorator(CACHE, options);

@Aspect(CACHE)
export class CacheDecorator implements LazyDecorator<any, CacheOptions> {
  constructor(private readonly cache: Cache) {}

  wrap({ method, metadata: options }: WrapParams<any, CacheOptions>) {
    return (...args: any[]) => {
      const cached = this.cache.get(...args);
      return cached ?? this.cache.set(method(...args), ...args);
    };
  }
}

@Injectable()
export class UserService {
  @Cache({ ttl: 1000 })
  findAll() {
    // ...
  }
}
```

See [Usage](#usage) below for the full, step-by-step breakdown of how the pieces fit together.

<!-- USAGE EXAMPLES -->

## Usage

#### 1. Import AopModule

```typescript
@Module({
  imports: [
    // ...
    AopModule,
  ],
})
export class AppModule {}
```

#### 2. Create symbol for LazyDecorator

```typescript
export const CACHE_DECORATOR = Symbol('CACHE_DECORATOR');
```

#### 3. Implement LazyDecorator using nestjs provider

`metadata` is passed as the second argument to `createDecorator` and is made available in the `WrapParams` for the `wrap` method.

```typescript
@Aspect(CACHE_DECORATOR)
export class CacheDecorator implements LazyDecorator<any, CacheOptions> {
  constructor(private readonly cache: Cache) {}

  wrap({ method, metadata: options }: WrapParams<any, CacheOptions>) {
    return (...args: any) => {
      let cachedValue = this.cache.get(...args);
      if (!cachedValue) {
        cachedValue = method(...args);
        this.cache.set(cachedValue, ...args);
      }
      return cachedValue;
    };
  }
}
```

#### 4. Add LazyDecoratorImpl to providers of module

```typescript
@Module({
  providers: [CacheDecorator],
})
export class CacheModule {}
```

#### 5. Create decorator that marks metadata of LazyDecorator

`options` can be obtained from the `wrap` method and used.

```typescript
export const Cache = (options: CacheOptions) => createDecorator(CACHE_DECORATOR, options);
```

#### 6. Use it!

```typescript
export class SomeService {
  @Cache({
    // ...options(metadata value)
  })
  some() {
    // ...
  }
}
```

## Typed method decorators

Use `createDecorator<T>` to check a decorated method against the same function type used by `LazyDecorator<T>`. This is opt-in: existing `createDecorator` calls remain unrestricted.

```typescript
type TextMethod = (value: string) => string;
const TEXT = Symbol('TEXT');
const Uppercase = () => createDecorator<TextMethod>(TEXT);

@Aspect(TEXT)
export class UppercaseAspect implements LazyDecorator<TextMethod> {
  wrap({ method }: WrapParams<TextMethod>): TextMethod {
    return (value) => method(value).toUpperCase();
  }
}

@Injectable()
export class TextService {
  @Uppercase()
  text(value: string): string {
    return value;
  }

  // Compile error: number is incompatible with the shared string argument.
  // @Uppercase()
  number(value: number): string {
    return String(value);
  }
}
```

Register the aspect as a provider and import `AopModule` as usual. The typed overload uses the same wrapping pipeline and optional metadata argument as existing calls. `TypedMethodDecorator<T>` is exported for explicitly annotating decorator factories.

### Infer the original method's signature

For an aspect that works with many method signatures, keep `F` generic all the way from the options to the returned `TypedMethodDecorator<F>`. When the factory is called directly in `@Retry(...)`, TypeScript can infer `F` from the decorated method and use it to type the options callback:

```typescript
type AsyncMethod = (...args: any[]) => Promise<unknown>;
type RetryOptions<F extends AsyncMethod> = {
  retries: number;
  onSuccess?: (args: Parameters<F>, result: Awaited<ReturnType<F>>) => void;
};
const RETRY = Symbol('RETRY');
const Retry = <F extends AsyncMethod>(options: RetryOptions<F>) =>
  createDecorator<F>(RETRY, options);

class UserService {
  @Retry({
    retries: 3,
    onSuccess(args, result) {
      const id: number = args[0];
      const name: string = result.name;
      console.log(id, name);
    },
  })
  async find(id: number): Promise<{ name: string }> {
    return { name: String(id) };
  }
}
```

This is a type-inference example; `Retry` options need a corresponding registered aspect. A shared aspect instance does not acquire a single concrete method type from the metadata key. Its implementation can instead have a generic `wrap<F>` and delegate to a helper that preserves `F`:

```typescript
// Contract of a user-provided retry utility, not an implementation supplied here.
declare function retryify<F extends AsyncMethod>(original: F, options: RetryOptions<F>): F;

@Aspect(RETRY)
class RetryAspect implements LazyDecorator<AsyncMethod, RetryOptions<AsyncMethod>> {
  wrap<F extends AsyncMethod>({ method, metadata }: WrapParams<F, RetryOptions<F>>): F {
    return retryify(method, metadata);
  }
}
```

The helper must really preserve the original contract, including receiver behavior. Simply returning `async (...args: Parameters<F>) => original(...args)` does not prove that the result is arbitrary `F`; an assertion would hide that gap. Register the aspect and import `AopModule` as usual.

Inference has boundaries:

- Calling `Retry(...)` before the decorator is attached, for example `const retry = Retry(...)`, has no original-method context at that call. Its options fall back to the generic constraint and the resulting decorator may be too broad to apply. Give a shared type explicitly when precreating a decorator, or create it directly at the method.
- Do not erase the factory's return type to `MethodDecorator`. Preserve `TypedMethodDecorator<F>` (inferred or explicit), and ensure the options themselves reference `F`.
- Preserve `F` as a whole to keep overloaded and generic call signatures. `Parameters<F>` and `ReturnType<F>` only inspect the last overload; generic identity methods yield `unknown` through those utilities. In particular, an overload's `onSuccess` callback is not a sound per-overload view of every call. Use a suitable explicit contract or avoid relying on that callback for overloaded methods.
- This infers from the method, not from the symbol or aspect registration. Fixed-signature aspects still need an explicit shared contract, as in the `Uppercase` example.

### Type checking and limits

- Enable `strict` and `experimentalDecorators`. These are TypeScript **legacy decorators**, not the newer standard decorator API.
- For a fixed-signature aspect, supply the shared function type explicitly. A generic aspect can use the original-method inference pattern above. It is not inferred from the metadata key, and a key does not verify the type of the registered aspect. Use the same type alias for the decorator, `LazyDecorator`, and `WrapParams`.
- The decorated method keeps its own public signature. For asynchronous methods, use a function type returning `Promise<Result>`. For overloads or generic methods, share the full overloaded or generic callable type; a wrapper must preserve that contract.
- An explicit `this` parameter in the shared type also checks the decorator target. A `this: void` contract does not require a receiver shape. Include the receiver contract when it matters; an omitted `this` does not check receiver requirements. The existing runtime binding behavior is unchanged.
- These are TypeScript structural compatibility checks, not exact type equality or runtime validation. Prefer a function-syntax alias such as `(value: string) => string`. Method-indexed types can retain TypeScript's bivariant parameter behavior, wider method parameters may be accepted (for example, a `string | number` method with a `string` contract), and `any` or type assertions can bypass checking. Ensure the shared type covers **all inputs the method publicly accepts**, so the aspect can handle every caller.
- The generic overload describes instance method contracts, not getters/setters or class fields. Keep using the original overload (without a type argument) for accessors. TypeScript cannot distinguish a function-valued accessor from a method in a legacy descriptor, and type arguments are erased at runtime, so this API cannot reject that misuse automatically. Existing accessor behavior is unchanged.

<!-- GETTER, SETTER AND INHERITANCE SUPPORT -->

## Getter, Setter and Inheritance Support

`createDecorator` can also be applied to `get`/`set` accessors, and decorated methods or accessors are inherited correctly by subclasses.

```typescript
class UserService {
  private _name = 'John';

  @Cache({ ttl: 1000 })
  get name() {
    return this._name.toUpperCase();
  }
}
```

- A decorator can be applied to a `get` accessor, a `set` accessor, or a regular method — but **not to a property that has both a getter and a setter**. Split them into separate properties, or use a regular method instead.
- A decorated method or accessor keeps working when called through a subclass instance.

<!-- CAVEATS -->

## Caveats

If you’re testing with NestJS’s TestingModule, don’t forget to call the init method.

```typescript
import { Test } from '@nestjs/testing';

const module = await Test.createTestingModule({
  // ...
}).compile();

await module.init();
```

<!-- REFERENCES -->

## References

- https://toss.tech/article/nestjs-custom-decorator
- https://youtu.be/VH1GTGIMHQw?t=2973

<!-- CONTRIBUTING -->

## Contributing

We welcome contributions from everyone to this project. Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guide.

<!-- LICENSE -->

## License

MIT © Viva Republica, Inc. See [LICENSE](LICENSE) for details.

<!-- BOTTOM LOGO -->
<a title="Toss" href="https://toss.im">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://static.toss.im/logos/png/4x/logo-toss-reverse.png">
    <img alt="Toss" src="https://static.toss.im/logos/png/4x/logo-toss.png" width="100">
  </picture>
</a>
