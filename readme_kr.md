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
    <li><a href="#타입이-있는-메서드-데코레이터">타입이 있는 메서드 데코레이터</a></li>
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
- ✅ **NestJS 8 → 12 지원** — 메이저 버전 트레드밀 없이 패키지 하나로 대응해요
- 🧬 **상속까지 고려** — 데코레이팅된 메소드는 자식 클래스에서 호출해도 그대로 동작해요

<!-- 설치 방법 -->

## 설치 방법

```sh
npm install @toss/nestjs-aop
pnpm add @toss/nestjs-aop
yarn add @toss/nestjs-aop
```

> **NestJS 12를 쓰고 있다면?** NestJS 12는 ESM 전용으로 배포되는데, 이 패키지는 CommonJS로 배포돼요.
> 그래서 로딩이 Node의 `require(esm)` 지원에 의존하고, NestJS 12 사용자는
> **Node.js `^20.19.0 || >=22.12.0`**가 필요해요. Node 20.x의 20.19.0 미만이나 Node 22.x의 22.12.0 미만에서는 `ERR_REQUIRE_ESM`으로 실패해요.
> NestJS 8 - 11 사용자는 영향이 없어요.

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

## 타입이 있는 메서드 데코레이터

`createTypedDecorator<T>`를 사용하면 데코레이터를 적용한 메서드와 `LazyDecorator<T>`에서 같은 함수 타입을 공유하고 호환성을 검사할 수 있습니다. 선택적으로 사용하는 API이며 기존 `createDecorator` 호출은 그대로 유지됩니다.

```typescript
type TextMethod = (value: string) => string;
const TEXT = Symbol('TEXT');
const Uppercase = () => createTypedDecorator<TextMethod>(TEXT);

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

  // 컴파일 오류: number 인자는 공유한 string 인자 타입과 호환되지 않습니다.
  // @Uppercase()
  number(value: number): string {
    return String(value);
  }
}
```

기존과 같이 aspect를 provider로 등록하고 `AopModule`을 import합니다. 새 API는 기존 래핑 로직을 사용하며 동일한 선택적 metadata 인자를 받습니다. 데코레이터 팩토리의 반환 타입을 명시할 때 사용할 `TypedMethodDecorator<T>`도 export합니다.

### 타입 검사 범위와 제한

- `strict`와 `experimentalDecorators`를 활성화해야 합니다. 새 표준 데코레이터가 아닌 TypeScript의 **레거시 데코레이터**용 API입니다.
- aspect와 검사하려는 공유 함수 타입을 직접 지정하세요. 생략하면 TypeScript가 적용 대상 메서드만 보고 타입을 추론할 수 있습니다. metadata 키에서 타입을 추론하거나 등록된 aspect의 타입을 검증하지 않습니다. 데코레이터, `LazyDecorator`, `WrapParams`에 같은 타입 별칭을 사용하세요.
- 데코레이터를 적용해도 메서드의 공개 시그니처는 바뀌지 않습니다. 비동기 메서드에는 `Promise<Result>`를 반환하는 함수 타입을 사용하세요. 오버로드나 제네릭 메서드는 전체 호출 시그니처를 공유하고 wrapper도 그 계약을 유지해야 합니다.
- 공유 타입에 명시적인 `this` 매개변수가 있으면 데코레이터 대상도 검사합니다. `this: void` 계약은 receiver의 구조를 요구하지 않습니다. receiver의 타입이 중요하면 이를 포함하세요. `this`를 생략하면 receiver 요구사항은 검사하지 않으며 기존 런타임 바인딩 동작은 유지됩니다.
- TypeScript의 구조적 호환성 검사이며 정확한 타입 동일성이나 런타임 검증을 보장하지 않습니다. `(value: string) => string`처럼 함수 문법으로 타입을 선언하는 것을 권장합니다. 메서드에서 추출한 타입은 매개변수의 bivariance가 유지될 수 있고 더 넓은 매개변수 타입이 허용될 수도 있으며(예: `string` 계약에 `string | number` 메서드), `any`와 타입 단언으로 검사를 우회할 수 있습니다. aspect가 모든 호출을 처리할 수 있도록 공유 타입에 **메서드가 공개적으로 받는 모든 입력**을 포함하세요.
- 타입 API는 인스턴스 메서드용이며 getter/setter나 클래스 필드는 지원하지 않습니다. 레거시 descriptor에서는 함수를 반환하는 접근자와 메서드를 타입만으로 구분할 수 없어 접근자는 런타임에 거부합니다. 기존 접근자 지원에는 `createDecorator`를 사용하세요.

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
