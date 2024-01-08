<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://toss.tech/wp-content/uploads/2022/11/tech-article-nest-js-02.png" alt="Logo" height="200">
  </a>

  <h2>@toss/nestjs-aop &middot; <a href="https://badge.fury.io/js/@toss%2Fnestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version" height="18"></a></h2>

  <p align="center">
    A way to gracefully apply AOP to nestjs
    <br>
    Use nestjs managed instances in any decorators gracefully
</a></h6>
  </p>
</div>

<br>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#Appendices">Appendicies</a></li>
    <li><a href="#references">References</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>




<!-- INSTALLATION -->
## Installation

```sh
npm install @toss/nestjs-aop
pnpm add @toss/nestjs-aop
yarn add @toss/nestjs-aop
```


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
`metadata` is the second parameter of createDecorator.

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
`options` can be obtained from the warp method and used.

```typescript
export const Cache = (options: CacheOptions) => createDecorator(CACHE_DECORATOR, options)
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

<!-- USAGE APPENDICES -->
## Appendices
### Appendix-1: A way to define metadata to the decorated target before it's called.
There's a limitation of `wrap` method; advice logic can only be triggered by calling the decorated method.
If you want to reference the metadata of the decorated method in `NestInterceptor` as an example, you couldn't get the correct metadata value even with reflection until the method was first called.
In this case, you can solve it by providing metadata to the target when `AopModule` is initialized with `init` method.
#### 1. Implement the 'init' method to the concrete implementation of LazyDecorator.
```typescript
@Aspect(CACHE_DECORATOR)
export class CacheDecorator implements LazyDecorator<any, CacheOptions> {
  constructor(private readonly cache: Cache) {}

  init({ unboundMethod, metadata: options }): InitParams<any, CacheOptions> {
    Reflect.defineMetadata('__CACHED_METHOD_WATERMARK__', true, unboundMethod);
  }

  wrap({ method, metadata: options }: WrapParams<any, CacheOptions>) {
    /* ... */
  }
}
```
#### 2. When AopModule invokes 'onModuleInit()', the 'init' method applies specified logic to the decorated target.
In the scenario of the above example, you can get metadata `__CACHED_METHOD_WARTERMARK__` with the value 'true' after `await app.init()`.
```typescript
async function bootstrap() {
  const app = module.createNestApplication(new FastifyAdapter());
  await app.init();
  /* ... */
}
bootstrap();
```

<!-- REFERENCES -->
## References
- https://toss.tech/article/nestjs-custom-decorator
- https://youtu.be/VH1GTGIMHQw?t=2973



<!-- CONTRIBUTING -->
## Contributing
We welcome contribution from everyone in this project. Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guide.



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
