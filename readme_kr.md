<div align="center">
  <a href="https://github.com/toss/nestjs-aop">
    <img src="https://static.toss.im/tech-article-nest-js-02.png" alt="nestjs-aop" height="140">
  </a>
  <h1>@toss/nestjs-aop</h1>
  <p>공통 로직은 데코레이터로. 의존성은 NestJS로.</p>
  <p>
    <a href="https://www.npmjs.com/package/@toss/nestjs-aop"><img src="https://badge.fury.io/js/@toss%2Fnestjs-aop.svg" alt="npm version"></a>
    <a href="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml"><img src="https://github.com/toss/nestjs-aop/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="https://github.com/toss/nestjs-aop/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@toss/nestjs-aop" alt="License"></a>
  </p>
  <p><a href="#설치">설치</a> · <a href="#빠르게-시작하기">빠르게 시작하기</a> · <a href="#문서">문서</a> · <a href="https://github.com/toss/nestjs-aop/blob/main/README.md">English</a></p>
</div>

로깅, 캐싱, 재시도 같은 공통 로직을 NestJS 메서드에 데코레이터로 적용하세요.
Aspect도 NestJS 프로바이더라서 앱의 다른 코드처럼 필요한 서비스를 주입받을 수 있어요.

- **한 번 만들고 재사용** · Aspect를 정의하고 데코레이터로 필요한 곳에 적용해요
- **NestJS와 함께** · 의존성 주입은 물론 메서드, 접근자, 상속도 지원해요
- **필요할 때 타입 검사** · `createDecorator<T>`로 공유 메서드 계약을 선택적으로 검사해요

## 설치

기존 NestJS 프로젝트에 설치하세요:

```sh
npm install @toss/nestjs-aop
```

`pnpm add @toss/nestjs-aop` / `yarn add @toss/nestjs-aop`도 사용할 수 있어요.

**NestJS 8–12를 지원해요.** NestJS 12에서는 Node.js `^20.19.0 || >=22.12.0`를 사용하세요.
NestJS 12는 ESM 전용이고 이 패키지는 CommonJS로 배포되어 Node의 `require(esm)` 지원이 필요해요.
이보다 이전 Node 20/22 버전에서는 `ERR_REQUIRE_ESM`으로 실패해요. NestJS 8–11 사용자는 영향이 없어요.

`tsconfig.json`에서 Nest의 **레거시 데코레이터** 설정을 유지하고, 메서드 타입 검사에는 `strict`를 활성화하세요:

```json
{
  "compilerOptions": {
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 빠르게 시작하기

프로바이더 등록부터 앱 실행까지 포함한 로깅 예제예요:

```typescript
import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';

const LOG = Symbol('LOG');
const Log = () => createDecorator(LOG);

@Injectable()
@Aspect(LOG)
class LogAspect implements LazyDecorator {
  wrap({ method, methodName }: WrapParams) {
    return (...args: unknown[]) => {
      console.log(`Calling ${methodName}`);
      return method(...args);
    };
  }
}

@Injectable()
class GreetingService {
  @Log()
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}

@Module({
  imports: [AopModule],
  providers: [LogAspect, GreetingService],
})
class AppModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  console.log(app.get(GreetingService).greet('Nest'));
  await app.close();
}

void main();
```

```text
Calling greet
Hello, Nest!
```

`Log`가 메서드에 표시를 남기고, `LogAspect`가 메서드를 감싸며, `AopModule`이 초기화할 때 둘을 연결해요.
원본 반환값은 그대로 유지돼요. 테스트에서는 `TestingModule`을 컴파일한 뒤 `await module.init()`을 호출하세요.

## 문서

- **[사용 가이드](https://github.com/toss/nestjs-aop/blob/main/docs/usage_kr.md)** · 데코레이터 작성, metadata 전달, 서비스 주입, 접근자·상속·테스트
- **[타입이 있는 데코레이터](https://github.com/toss/nestjs-aop/blob/main/docs/typed-decorators_kr.md)** · 공유 계약, 원본 메서드 타입 추론, TypeScript의 검사 범위
- **[v1에서 v2로 마이그레이션](https://github.com/toss/nestjs-aop/blob/main/docs/migration-guide-v2.md)** (영문) · `SetMetadata`를 `createDecorator`로 교체하기

메서드 타입 검사는 선택 사항이에요. 기존 `createDecorator(key, metadata?)` 호출도 그대로 사용할 수 있어요.

## 배경

- [NestJS에서 커스텀 데코레이터를 만든 이유](https://toss.tech/article/nestjs-custom-decorator)
- [관련 발표](https://youtu.be/VH1GTGIMHQw?t=2973)

## 기여하기

누구나 기여할 수 있어요. [기여 가이드](https://github.com/toss/nestjs-aop/blob/main/CONTRIBUTING.md)에서 시작하는 방법을 확인하세요.

## 라이선스

MIT © Viva Republica, Inc. [LICENSE](https://github.com/toss/nestjs-aop/blob/main/LICENSE)를 참고하세요.

<a title="Toss" href="https://toss.im">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://static.toss.im/logos/png/4x/logo-toss-reverse.png">
    <img alt="Toss" src="https://static.toss.im/logos/png/4x/logo-toss.png" width="80">
  </picture>
</a>
