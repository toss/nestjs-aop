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
- ✅ **NestJS 8 → 11** — one package, no major-version treadmill
- 🧬 **Inheritance-aware** — decorated methods keep working when called through a subclass

<!-- INSTALLATION -->

## Installation

```sh
npm install @toss/nestjs-aop
pnpm add @toss/nestjs-aop
yarn add @toss/nestjs-aop
```

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
