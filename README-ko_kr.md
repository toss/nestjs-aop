<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://toss.tech/wp-content/uploads/2022/11/tech-article-nest-js-02.png" alt="Logo" height="200">
  </a>

  <h2>@toss/nestjs-aop &middot; <a href="https://badge.fury.io/js/@toss%2Fnestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version" height="18"></a></h2>

  <p align="center">
    NestJS에 우아하게 AOP를 적용하는 방법
    <br>
    NestJS 관리 인스턴스를 모든 데코레이터에서 우아하게 사용하세요
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
    <li><a href="#references">References</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>




<!-- 설치 방법 -->
## 설치 방법

```sh
npm install @toss/nestjs-aop
pnpm add @toss/nestjs-aop
yarn add @toss/nestjs-aop
```


<!-- 사용 예시 -->
## 사용 예시

#### 1. AopModule Import 하기
```typescript
@Module({
  imports: [
    // ...
    AopModule,
  ],
})
export class AppModule {}
```

#### 2. LazyDecorator를 위한 심볼 생성
```typescript
export const CACHE_DECORATOR = Symbol('CACHE_DECORATOR');
```

#### 3. NestJS 프로바이더를 사용하여 LazyDecorator 구현하기
`metadata`는 createDecorator의 두 번째 매개변수입니다.

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

#### 4. 모듈의 프로바이더에 LazyDecoratorImpl 추가하기
```typescript
@Module({
  providers: [CacheDecorator],
})
export class CacheModule {}
```

#### 5. LazyDecorator의 metadata를 나타내는 데코레이터 생성
`options`는 wrap 메소드에서 얻을 수 있으며 사용될 수 있습니다.

```typescript
export const Cache = (options: CacheOptions) => createDecorator(CACHE_DECORATOR, options)
```

#### 6. 사용하기!
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


<!-- 참고자료 -->
## 참고자료
- https://toss.tech/article/nestjs-custom-decorator
- https://youtu.be/VH1GTGIMHQw?t=2973



<!-- 기여하기 -->
## 기여하기
이 프로젝트에는 모든 분들의 기여를 환영합니다. 자세한 기여 가이드는 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.



<!-- LICENSE -->
## License
MIT © Viva Republica, Inc. [LICENSE](LICENSE) 파일을 참고하세요.


<!-- BOTTOM LOGO -->
<a title="Toss" href="https://toss.im">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://static.toss.im/logos/png/4x/logo-toss-reverse.png">
    <img alt="Toss" src="https://static.toss.im/logos/png/4x/logo-toss.png" width="100">
  </picture>
</a>
