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

#### 4. Create decorator that mark metadata of LazyDecorator
```typescript
export const Foo = (options: FooOptions) => SetMetadata(FOO, options);
```

#### 5. Use it!
```typescript
export class SomeService {
  @Foo({
    // ...options(metadata value)
  })
  some() {
    // ...
  }
}
```


<!-- CAVEAT -->
## Caveat
Controllers do not apply LazyDecorator. Because [registerRouter is called before callInitHook.](https://github.com/nestjs/nest/blob/349840e0165b38de10e81ebce02b5c878124a9af/packages/core/nest-application.ts#L174-L175)
 
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
