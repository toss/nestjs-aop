# 사용 가이드

[처음으로](../../readme_kr.md) · [English](../en/usage.md) | 한국어 · [타입이 있는 데코레이터](typed-decorators.md)

Aspect는 메서드를 감싸는 NestJS 프로바이더입니다. 데코레이터는 공유 키로 메서드와 aspect를 연결하고, 선택적인 metadata로 메서드별 옵션을 전달합니다.

[빠르게 시작하기](../../readme_kr.md#빠르게-시작하기)에는 완전한 앱 예제가 있습니다. 이 가이드에서는 metadata와 서비스 주입을 추가하고, 접근자·상속·테스트를 살펴봅니다. Nest의 레거시 데코레이터를 위해 `experimentalDecorators`와 `emitDecoratorMetadata`를 활성화하세요.

## 1. 키와 데코레이터 정의하기

`createDecorator`와 `@Aspect`에 같은 키를 사용합니다. `symbol`을 사용하면 의도치 않은 키 충돌을 피하기 쉽고, 문자열도 지원합니다.

```typescript
import { Injectable, Module } from '@nestjs/common';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';

type LogOptions = { label: string };
type AnyMethod = (...args: any[]) => any;

const LOG = Symbol('LOG');
const Log = (options: LogOptions) => createDecorator(LOG, options);
```

`createDecorator`의 두 번째 인자는 `wrap`의 `metadata`로 전달됩니다. 생략하거나 어떤 값이든 전달할 수 있으며, 이 예제에서는 `LogOptions`를 계약으로 사용합니다.

## 2. Aspect 구현하기

`@Aspect(LOG)`로 프로바이더와 키를 연결합니다. `LazyDecorator`를 구현하고 `wrap`에서 원본을 대체할 함수를 반환하세요.

```typescript
@Injectable()
class AuditLogger {
  record(message: string) {
    console.log(message);
  }
}

@Injectable()
@Aspect(LOG)
class LogAspect implements LazyDecorator<AnyMethod, LogOptions> {
  constructor(private readonly audit: AuditLogger) {}

  wrap({ method, methodName, metadata }: WrapParams<AnyMethod, LogOptions>): AnyMethod {
    return (...args: unknown[]) => {
      this.audit.record(`[${metadata.label}] ${methodName}`);
      return method(...args);
    };
  }
}
```

`WrapParams`는 다음 값을 제공합니다:

- `method`: 데코레이터가 적용된 인스턴스에 이미 바인딩된 원본 함수
- `methodName`: 데코레이터가 적용된 메서드 또는 접근자의 이름
- `instance`: 호출을 받는 객체
- `metadata`: `createDecorator`에 전달한 값

`method(...args)`를 호출하면 원본 동작을 이어갑니다. 이 로깅 wrapper는 반환된 Promise를 포함해 원본 반환값을 그대로 유지하고, 에러도 그대로 전파합니다. 캐싱·재시도 등 추가 동작은 aspect에서 직접 구현해야 합니다.

호출할 때마다 필요한 작업은 반환하는 함수 안에 두세요. 런타임은 인스턴스와 원본 함수별로 wrapper를 생성하고 캐시하므로, `wrap` 자체가 매번 실행되는 훅은 아닙니다.

## 3. 서비스에 데코레이터 적용하기

```typescript
@Injectable()
class GreetingService {
  @Log({ label: 'greeting' })
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}
```

`LazyDecorator<AnyMethod, LogOptions>`는 aspect 구현의 타입을 표현합니다. 데코레이터가 적용된 메서드의 시그니처까지 검사하려면 [`createDecorator<T>`](typed-decorators.md)를 사용하세요. metadata 키만으로 공유 타입이 강제되지는 않습니다.

## 4. 모듈과 프로바이더 등록하기

`AopModule`을 import하고 aspect, aspect의 의존성, 서비스를 프로바이더로 등록합니다. 서로 다른 모듈에 등록한다면 일반적인 NestJS 모듈의 의존성 공개 규칙을 따라야 합니다.

```typescript
@Module({
  imports: [AopModule],
  providers: [AuditLogger, LogAspect, GreetingService],
})
class AppModule {}
```

Nest가 앱을 초기화한 뒤 `app.get(GreetingService).greet('Nest')`를 호출하면 `[greeting] greet`를 출력하고 `Hello, Nest!`를 반환합니다. 앱 컨텍스트를 실행하는 코드는 [빠르게 시작하기](../../readme_kr.md#빠르게-시작하기)를 참고하세요.

## Getter, Setter, 상속

기존 `createDecorator` overload는 getter 또는 setter도 지원합니다. 접근자에는 **타입 인자 없이** 사용하세요.

```typescript
@Injectable()
class UserProfile {
  protected name = 'Ada';

  @Log({ label: 'profile' })
  get displayName() {
    return this.name.toUpperCase();
  }
}

@Injectable()
class AdminProfile extends UserProfile {}
```

`GreetingService`와 마찬가지로 이 클래스들도 Nest 프로바이더로 등록하세요. 초기화된 `AdminProfile` 인스턴스에서 `displayName`을 읽으면 `UserProfile`에서 상속받은 aspect가 실행됩니다.

- 일반 메서드, getter, setter를 데코레이터로 감쌀 수 있습니다
- **getter와 setter가 모두 있는 프로퍼티는 지원하지 않으며** 데코레이션 시 에러가 발생합니다. 별도 프로퍼티로 나누거나 일반 메서드를 사용하세요
- 데코레이터가 적용된 메서드와 접근자는 자식 클래스 인스턴스에서도 동작합니다
- 타입 overload는 접근자나 클래스 필드가 아닌 인스턴스 메서드를 표현합니다. [타입 검사 범위와 제한](typed-decorators.md#타입-검사-범위와-제한)을 참고하세요

## 테스트

`TestingModule`을 컴파일한 것만으로는 초기화 훅이 실행되지 않습니다. 데코레이터가 적용된 메서드를 테스트하기 전에 `await module.init()`을 호출하고, 테스트 후 모듈을 닫으세요.

```typescript
import { Test } from '@nestjs/testing';

it('runs a decorated method', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  await module.init();

  try {
    expect(module.get(GreetingService).greet('Nest')).toBe('Hello, Nest!');
  } finally {
    await module.close();
  }
});
```

이 예제는 프로젝트에 Jest 설정이 되어 있다고 가정합니다. 초기화는 테스트 러너나 모듈 형식과 관계없이 필요합니다.

## 다음 단계

- [타입이 있는 데코레이터](typed-decorators.md): 공유 계약, 제네릭 추론, 검사 범위
- [v1에서 v2로 마이그레이션](../migration-guide-v2.md) (영문): `SetMetadata`를 `createDecorator`로 교체하기
