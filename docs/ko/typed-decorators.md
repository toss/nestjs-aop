# 타입이 있는 데코레이터

[처음으로](../../README.ko.md) · [사용 가이드](usage.md) · [English](../en/typed-decorators.md) | 한국어

레거시 메서드 데코레이터에 선택적으로 적용하는 컴파일 시점 타입 검사입니다. Aspect 등록과 런타임 동작은 [사용 가이드](usage.md)부터 참고하세요.

## 공유 메서드 계약

`createDecorator<T>`를 사용하면 데코레이터를 적용한 메서드와 `LazyDecorator<T>`에서 같은 함수 타입을 공유하고 호환성을 검사할 수 있습니다. 선택적으로 사용하는 API이며 기존 `createDecorator` 호출은 그대로 유지됩니다.

`createDecorator<TextMethod>`처럼 공유 계약을 명시하는 형태는 TypeScript 4.7 이상에서 제공하는 타입 시스템 기능을 사용합니다. 패키지의 ESM/모듈 호환성 조건은 별도입니다. NodeNext를 사용하는 CommonJS 앱에는 TypeScript >= 5.8이 필요합니다. 컴파일러 설정은 [v3 마이그레이션 가이드](../migrations/v3.md#typescript-consumers) (영문)를 참고하세요.

```typescript
import { Injectable } from '@nestjs/common';
import { Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';

type TextMethod = (value: string) => string;
const TEXT = Symbol('TEXT');
const Uppercase = () => createDecorator<TextMethod>(TEXT);

@Injectable()
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

기존과 같이 aspect를 provider로 등록하고 `AopModule`을 import합니다. 타입 overload는 기존 호출과 동일한 래핑 로직과 선택적 metadata 인자를 사용합니다. 데코레이터 팩토리의 반환 타입을 명시할 때 사용할 `TypedMethodDecorator<T>`도 export합니다.

## 원본 메서드의 타입 추론하기

데코레이터를 적용한 메서드에서 `F`를 추론하려면 **TypeScript 5.0 이상**이 필요합니다. TypeScript 4.x에서는 위 예제처럼 공유 계약을 명시하거나 `Retry<Method>(...)`처럼 제네릭 팩토리에 메서드 타입을 직접 지정하세요.

여러 메서드 시그니처에 적용할 수 있는 aspect라면 options부터 반환하는 `TypedMethodDecorator<F>`까지 `F`를 제네릭으로 유지하세요. `@Retry(...)` 위치에서 팩토리를 직접 호출하면 TypeScript가 원본 메서드에서 `F`를 추론하고 options 콜백에도 적용할 수 있습니다.

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

이 예제는 타입 추론을 보여줍니다. `Retry` options를 처리할 aspect도 등록해야 합니다. 공유 aspect 인스턴스가 metadata 키에서 특정 메서드 하나의 구체적인 타입을 얻는 것은 아닙니다. 구현부는 `wrap<F>`를 제네릭으로 만들고 `F`를 보존하는 helper에 위임할 수 있습니다.

```typescript
// 사용자가 제공하는 retry utility의 계약이며, 여기서 구현을 제공하지 않습니다.
declare function retryify<F extends AsyncMethod>(original: F, options: RetryOptions<F>): F;

@Injectable()
@Aspect(RETRY)
class RetryAspect implements LazyDecorator<AsyncMethod, RetryOptions<AsyncMethod>> {
  wrap<F extends AsyncMethod>({ method, metadata }: WrapParams<F, RetryOptions<F>>): F {
    return retryify(method, metadata);
  }
}
```

helper는 receiver 동작을 포함한 원본 계약을 실제로 유지해야 합니다. 단순히 `async (...args: Parameters<F>) => original(...args)`를 반환한다고 임의의 `F`가 되는 것은 아니며 타입 단언으로 덮으면 그 차이를 숨기게 됩니다. 기존과 같이 aspect를 등록하고 `AopModule`을 import하세요.

추론에는 다음과 같은 제한이 있습니다.

- `const retry = Retry(...)`처럼 데코레이터를 미리 생성하면 그 호출 시점에는 원본 메서드 문맥이 없습니다. options는 제네릭 제약 타입으로 돌아가며 반환된 데코레이터가 너무 넓어 적용이 거부될 수도 있습니다. 미리 생성할 때는 공유 타입을 직접 지정하거나 메서드 위치에서 팩토리를 호출하세요.
- 팩토리 반환 타입을 `MethodDecorator`로 지우지 마세요. 추론 또는 명시적으로 `TypedMethodDecorator<F>`를 유지하고 options도 `F`를 참조해야 합니다.
- 오버로드·제네릭 호출 시그니처를 유지하려면 `F` 자체를 보존하세요. `Parameters<F>`와 `ReturnType<F>`는 마지막 오버로드만 조회하고, 제네릭 identity 메서드는 이 유틸리티를 통해 `unknown`으로 조회됩니다. 특히 오버로드의 `onSuccess` 콜백 타입이 모든 호출을 안전하게 표현하는 것은 아닙니다. 적절한 명시적 계약을 사용하거나 오버로드 메서드에서 해당 콜백 타입에 의존하지 마세요.
- 원본 메서드에서 추론하는 것이며 symbol이나 aspect 등록에서 추론하는 것은 아닙니다. 특정 시그니처만 처리하는 aspect는 `Uppercase` 예제처럼 공유 계약을 명시해야 합니다.

## 타입 검사 범위와 제한

- `experimentalDecorators`를 활성화해야 합니다. 새 표준 데코레이터가 아닌 TypeScript의 **레거시 데코레이터**용 API입니다.
- 더 꼼꼼한 메서드 타입 검사를 위해 `strict` 활성화를 권장하지만, 라이브러리 사용의 필수 조건은 아닙니다.
- 특정 시그니처만 처리하는 aspect는 공유 함수 타입을 직접 지정하세요. 제네릭 aspect는 위의 원본 메서드 추론 패턴을 사용할 수 있습니다. metadata 키에서 타입을 추론하거나 등록된 aspect의 타입을 검증하지 않습니다. 데코레이터, `LazyDecorator`, `WrapParams`에 같은 타입 별칭을 사용하세요.
- 데코레이터를 적용해도 메서드의 공개 시그니처는 바뀌지 않습니다. 비동기 메서드에는 `Promise<Result>`를 반환하는 함수 타입을 사용하세요. 오버로드나 제네릭 메서드는 전체 호출 시그니처를 공유하고 wrapper도 그 계약을 유지해야 합니다.
- 공유 타입에 명시적인 `this` 매개변수가 있으면 데코레이터 대상도 검사합니다. `this: void` 계약은 receiver의 구조를 요구하지 않습니다. receiver의 타입이 중요하면 이를 포함하세요. `this`를 생략하면 receiver 요구사항은 검사하지 않으며 기존 런타임 바인딩 동작은 유지됩니다.
- TypeScript의 구조적 호환성 검사이며 정확한 타입 동일성이나 런타임 검증을 보장하지 않습니다. `(value: string) => string`처럼 함수 문법으로 타입을 선언하는 것을 권장합니다. 메서드에서 추출한 타입은 매개변수의 bivariance가 유지될 수 있고 더 넓은 매개변수 타입이 허용될 수도 있으며(예: `string` 계약에 `string | number` 메서드), `any`와 타입 단언으로 검사를 우회할 수 있습니다. aspect가 모든 호출을 처리할 수 있도록 공유 타입에 **메서드가 공개적으로 받는 모든 입력**을 포함하세요.
- 제네릭 overload는 getter/setter나 클래스 필드가 아닌 인스턴스 메서드의 계약을 표현합니다. 접근자에는 타입 인자가 없는 기존 overload를 사용하세요. 레거시 descriptor에서는 함수를 반환하는 접근자와 메서드를 타입만으로 구분할 수 없고 타입 인자는 런타임에 지워지므로, 이런 오용을 자동으로 거부하지는 못합니다. 기존 접근자 동작은 유지됩니다.
