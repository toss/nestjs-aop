<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://toss.tech/wp-content/uploads/2022/11/tech-article-nest-js-02.png" alt="Logo" height="200">
  </a>

  <h2>@toss/nestjs-aop &middot; <a href="https://badge.fury.io/js/@toss%2Fnestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version" height="15"></a></h2>

  <p align="center">
    A way to gracefully apply AOP to nestjs
    <br>
    Use nestjs managed instances in any decorators gracefully
    <h6>CAVEAT: <a>Use interceptor over this when it comes to controller
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
    <li><a href="#caveat">Caveat</a></li>
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
```typescript
@Aspect(CACHE_DECORATOR)
export class CacheDecorator implements LazyDecorator<any, CacheOptions> {
  constructor(private readonly cache: Cache) {}

  wrap({ method, metadata: options }: WrapParams<any, CacheOptions>) {
    return (...args: any) => {
      const cache = this.cache.get(...args)
      if (cache) { 
        return cache;
      }
      return method(...args);
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
```typescript
export const Cache = (options: CacheOptions) => SetMetadata(CACHE_DECORATOR, options);
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


<!-- CAVEAT -->
## Caveat
LazyDecorator doesn't support controller now. Because [registerRouter is called before callInitHook.](https://github.com/nestjs/nest/blob/349840e0165b38de10e81ebce02b5c878124a9af/packages/core/nest-application.ts#L174-L175)
 
```typescript
  // NestApplication.init
  // ...
  await this.registerRouter();
  await this.callInitHook();
```

However, the controller's method have been already registered in the router before wrapping, so it does not work.
<br>
<br>
Because Nestjs has Interceptors, we decided to leave this issue for a while even though we can solve it right now.


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
