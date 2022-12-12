<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://wp-blog.toss.im/wp-content/uploads/2022/09/toss-symbol.jpg" alt="Logo" height="100">
  </a>

  <h3 align="center">@toss/nestjs-aop</h3>

  <p align="center">
    A way to gracefully apply AOP to nestjs
    <br>
    Use nestjs managed instances in any decorator gracefully
    <h5>CAVEAT: <a>Use interceptor over this when it comes to controller
</a></h5>
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
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>




<!-- INSTALLATION -->
## Installation

```sh
npm install @toss/nestjs-api
pnpm add @toss/nestjs-api
yarn add @toss/nestjs-api
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

#### 2. Create symbol and decorator for LazyDecorator
```typescript
export const FOO = Symbol('FOO');
export const Foo = (options: FooOptions) => SetMetadata(FOO, options);
```

#### 3. Implement LazyDecorator using nestjs provider
```typescript
@Aspect(FOO)
export class FooDecorator implements LazyDecorator<any, FooOptions> {
  constructor(private readonly cache: Cache) {}

  wrap({ method, metadata: options }: WrapParams<any, FooOptions>) {
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


<!-- CAVEAT -->
## Caveat
LazyDecorator does not apply to controllers. Because [registerRouter is called before callInitHook.](https://github.com/nestjs/nest/blob/349840e0165b38de10e81ebce02b5c878124a9af/packages/core/nest-application.ts#L174-L175)
 
```typescript
  // NestApplication.init
  // ...
  await this.registerRouter();
  await this.callInitHook();
```

AopModule works by wrapping the provider's method in the onModuleInit step. So the controller's method is already registered with the router before wrapping and does not work.
<br>
<br>
We can solve this problem, but we decided to pend it right now because Nestjs already has Interceptors.


<!-- CONTRIBUTING -->
## Contributing
We welcome contribution from everyone in this project. Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guide.



<!-- LICENSE -->
## License
MIT © Viva Republica, Inc. See [LICENSE.md](LICENSE.md) for details.


<!-- BOTTOM LOGO -->
<a title="Toss" href="https://toss.im">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://static.toss.im/logos/png/4x/logo-toss-reverse.png">
    <img alt="Toss" src="https://static.toss.im/logos/png/4x/logo-toss.png" width="100">
  </picture>
</a>
