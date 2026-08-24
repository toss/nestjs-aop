<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://static.toss.im/tech-article-nest-js-02.png" alt="Logo" height="200">
  </a>

  <h2>@toss/nestjs-aop</h2>

  <p align="center">
    NestJS에 우아하게 AOP를 적용하는 방법
    <br>
    NestJS 관리 인스턴스를 모든 데코레이터에서 우아하게 사용하세요.
  </p>

  <p align="center">
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version"></a>
    <a href="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml"><img src="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://img.shields.io/npm/types/@toss/nestjs-aop" alt="types"></a>
    <a href="https://bundlephobia.com/package/@toss/nestjs-aop"><img src="https://img.shields.io/bundlephobia/minzip/@toss/nestjs-aop" alt="bundle size"></a>
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://img.shields.io/npm/dm/@toss/nestjs-aop.svg" alt="downloads"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@toss/nestjs-aop" alt="license"></a>
    <a href="https://github.com/toss/nestjs-aop/stargazers"><img src="https://img.shields.io/github/stars/toss/nestjs-aop?style=social" alt="stars"></a>
  </p>
</div>

<br>

[English](https://github.com/toss/nestjs-aop/blob/main/README.md) | 한국어

<!-- 목차 -->
<details>
  <summary>목차</summary>
  <ol>
    <li><a href="#특징">특징</a></li>
    <li><a href="#설치 방법">설치 방법</a></li>
    <li><a href="#빠르게-시작하기">빠르게 시작하기</a></li>
    <li><a href="#사용 예시">사용 예시</a></li>
    <li><a href="#getter-setter-상속-지원">Getter, Setter, 상속 지원</a></li>
    <li><a href="#주의사항">주의사항</a></li>
    <li><a href="#참고자료">참고자료</a></li>
    <li><a href="#기여하기">기여하기</a></li>
    <li><a href="#라이센스">라이센스</a></li>
  </ol>
</details>

<!-- 특징 -->

## 특징

- 🎯 **데코레이터 기반 AOP** — 메소드, getter, setter 어디든 캐싱·로깅·재시도 같은 공통 로직을 재사용 가능한 형태로 감쌀 수 있어요
- 🧩 **IoC 컨테이너와 자연스럽게 동작** — aspect도 평범한 NestJS provider라 필요한 건 `@Inject`로 그대로 받아 써요
- 🪶 **런타임 매직 없음** — 네이티브 데코레이터 + `reflect-metadata` 기반, 별도 코드 변환 단계가 없어요
- ✅ **NestJS 8 → 11 지원** — 메이저 버전 트레드밀 없이 패키지 하나로 대응해요
- 🧬 **상속까지 고려** — 데코레이팅된 메소드는 자식 클래스에서 호출해도 그대로 동작해요

<!-- 설치 방법 -->

## 설치 방법

```sh
npm install @toss/nestjs-aop
pnpm add @toss/nestjs-aop
yarn add @toss/nestjs-aop
```

<!-- 빠르게 시작하기 -->

## 빠르게 시작하기

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

각 조각이 어떻게 맞물리는지 단계별로 보고 싶다면 아래 [사용 예시](#사용-예시)를 참고하세요.

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

#### 3. NestJS 프로바이더로 LazyDecorator 구현하기

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
export const Cache = (options: CacheOptions) => createDecorator(CACHE_DECORATOR, options);
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

<!-- GETTER, SETTER, 상속 지원 -->

## Getter, Setter, 상속 지원

`createDecorator`는 `get`/`set` 접근자에도 적용할 수 있고, 데코레이팅된 메소드나 접근자는 자식 클래스에도 올바르게 상속됩니다.

```typescript
class UserService {
  private _name = 'John';

  @Cache({ ttl: 1000 })
  get name() {
    return this._name.toUpperCase();
  }
}
```

- 데코레이터는 `get` 접근자, `set` 접근자, 일반 메소드에 적용할 수 있지만, **같은 프로퍼티에 getter와 setter가 동시에 있으면 적용할 수 없습니다.** 서로 다른 프로퍼티로 분리하거나 일반 메소드를 사용하세요.
- 데코레이팅된 메소드나 접근자는 자식 클래스 인스턴스를 통해 호출해도 그대로 동작합니다.

<!-- 주의사항 -->

## 주의사항

NestJS의 `TestingModule`을 이용해 테스트할 경우 init 메소드 호출이 필요합니다.

```typescript
import { Test } from '@nestjs/testing';

const module = await Test.createTestingModule({
  // ...
}).compile();

await module.init();
```

<!-- 참고자료 -->

## 참고자료

- https://toss.tech/article/nestjs-custom-decorator
- https://youtu.be/VH1GTGIMHQw?t=2973

<!-- 기여하기 -->

## 기여하기

이 프로젝트에는 모든 분들의 기여를 환영합니다. 자세한 기여 가이드는 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

<!-- 라이센스 -->

## 라이센스

MIT © Viva Republica, Inc. [LICENSE](LICENSE) 파일을 참고하세요.

<!-- BOTTOM LOGO -->
<a title="Toss" href="https://toss.im">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://static.toss.im/logos/png/4x/logo-toss-reverse.png">
    <img alt="Toss" src="https://static.toss.im/logos/png/4x/logo-toss.png" width="100">
  </picture>
</a>
