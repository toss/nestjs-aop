# Usage guide

[Home](../../README.md) · English | [한국어](../ko/usage.md) · [Typed decorators](typed-decorators.md)

An aspect is a NestJS provider that wraps a method. A decorator connects the method to the aspect with a shared key; its optional metadata carries per-method options.

The [quick start](../../README.md#quick-start) shows a complete application. This guide adds metadata and an injected service, then covers accessors, inheritance, and testing. Keep `experimentalDecorators` and `emitDecoratorMetadata` enabled for Nest's legacy decorators.

## 1. Define a key and decorator

Use one shared key for `createDecorator` and `@Aspect`. A `symbol` helps avoid accidental key collisions; strings are also supported.

```typescript
import { Injectable, Module } from '@nestjs/common';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';

type LogOptions = { label: string };
type AnyMethod = (...args: any[]) => any;

const LOG = Symbol('LOG');
const Log = (options: LogOptions) => createDecorator(LOG, options);
```

The second argument to `createDecorator` becomes `metadata` in `wrap`. It is optional and may hold any value; `LogOptions` is the contract for this example.

## 2. Implement the aspect

`@Aspect(LOG)` associates the provider with the key. Implement `LazyDecorator` and return a replacement function from `wrap`.

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

`WrapParams` provides:

- `method`: the original callable, already bound to the decorated instance
- `methodName`: the name of the decorated method or accessor
- `instance`: the object receiving the call
- `metadata`: the value passed to `createDecorator`

Call `method(...args)` to continue the original operation. This logging wrapper preserves its return value, including a returned promise, and lets errors propagate. Implementing caching, retries, or other behavior remains the aspect's responsibility.

Keep call-time work inside the returned function. The runtime creates and caches wrappers per instance and original function; `wrap` itself is not an every-call hook.

## 3. Decorate a service

```typescript
@Injectable()
class GreetingService {
  @Log({ label: 'greeting' })
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}
```

`LazyDecorator<AnyMethod, LogOptions>` describes the aspect implementation. To also check the decorated method's signature, opt into [`createDecorator<T>`](typed-decorators.md). A metadata key does not enforce a shared type by itself.

## 4. Register the module and providers

Import `AopModule` and register the aspect, its dependencies, and your service. Normal NestJS module visibility rules still apply when these providers live in separate modules.

```typescript
@Module({
  imports: [AopModule],
  providers: [AuditLogger, LogAspect, GreetingService],
})
class AppModule {}
```

After Nest initializes the application, `app.get(GreetingService).greet('Nest')` logs `[greeting] greet` and returns `Hello, Nest!`. See the [quick start](../../README.md#quick-start) for the application-context bootstrap.

## Getters, setters, and inheritance

The original `createDecorator` overload also supports a getter or a setter. Use it **without a type argument** for accessors.

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

Register these classes as Nest providers, just like `GreetingService`. Reading `displayName` on an initialized `AdminProfile` instance still runs the aspect inherited from `UserProfile`.

- A decorator can wrap a regular method, a getter, or a setter
- A property with **both a getter and a setter is not supported** and throws during decoration; use separate properties or a regular method
- Decorated methods and accessors keep working through subclass instances
- The typed overload describes instance methods, not accessors or class fields; see its [type-checking limits](typed-decorators.md#type-checking-and-limits)

## Testing

A compiled `TestingModule` has not run its initialization hooks yet. Call `await module.init()` before exercising decorated methods, and close the module afterwards.

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

This example assumes your project's existing Jest setup. Initialization is required independently of the test runner or module format.

## Next steps

- [Typed decorators](typed-decorators.md): shared contracts, generic inference, and checking limits
- [Migrating from v1 to v2](../migration-guide-v2.md): replace `SetMetadata` with `createDecorator`
