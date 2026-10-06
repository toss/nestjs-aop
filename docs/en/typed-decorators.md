# Typed decorators

[Home](../../README.md) · [Usage](usage.md) · English | [한국어](../ko/typed-decorators.md)

Optional compile-time checks for legacy method decorators. Start with the [usage guide](usage.md) for aspect registration and runtime behavior.

## Shared method contracts

Use `createDecorator<T>` to check a decorated method against the same function type used by `LazyDecorator<T>`. This is opt-in: existing `createDecorator` calls remain unrestricted.

The explicit shared-contract form, such as `createDecorator<TextMethod>`, uses type-system features available in TypeScript 4.7 and later. The package's ESM/module compatibility requirements are separate: CommonJS applications using NodeNext require TypeScript >= 5.8. See the [v3 migration guide](../migrations/v3.md#typescript-consumers) when choosing compiler settings.

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

  // Compile error: number is incompatible with the shared string argument.
  // @Uppercase()
  number(value: number): string {
    return String(value);
  }
}
```

Register the aspect as a provider and import `AopModule` as usual. The typed overload uses the same wrapping pipeline and optional metadata argument as existing calls. `TypedMethodDecorator<T>` is exported for explicitly annotating decorator factories.

## Infer the original method's signature

Inferring `F` from the decorated method requires **TypeScript 5.0 or later**. On TypeScript 4.x, use an explicit shared contract as above, or pass the method type explicitly to a generic factory, such as `Retry<Method>(...)`.

For an aspect that works with many method signatures, keep `F` generic all the way from the options to the returned `TypedMethodDecorator<F>`. When the factory is called directly in `@Retry(...)`, TypeScript can infer `F` from the decorated method and use it to type the options callback:

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

This is a type-inference example; `Retry` options need a corresponding registered aspect. A shared aspect instance does not acquire a single concrete method type from the metadata key. Its implementation can instead have a generic `wrap<F>` and delegate to a helper that preserves `F`:

```typescript
// Contract of a user-provided retry utility, not an implementation supplied here.
declare function retryify<F extends AsyncMethod>(original: F, options: RetryOptions<F>): F;

@Injectable()
@Aspect(RETRY)
class RetryAspect implements LazyDecorator<AsyncMethod, RetryOptions<AsyncMethod>> {
  wrap<F extends AsyncMethod>({ method, metadata }: WrapParams<F, RetryOptions<F>>): F {
    return retryify(method, metadata);
  }
}
```

The helper must really preserve the original contract, including receiver behavior. Simply returning `async (...args: Parameters<F>) => original(...args)` does not prove that the result is arbitrary `F`; an assertion would hide that gap. Register the aspect and import `AopModule` as usual.

Inference has boundaries:

- Calling `Retry(...)` before the decorator is attached, for example `const retry = Retry(...)`, has no original-method context at that call. Its options fall back to the generic constraint and the resulting decorator may be too broad to apply. Give a shared type explicitly when precreating a decorator, or create it directly at the method.
- Do not erase the factory's return type to `MethodDecorator`. Preserve `TypedMethodDecorator<F>` (inferred or explicit), and ensure the options themselves reference `F`.
- Preserve `F` as a whole to keep overloaded and generic call signatures. `Parameters<F>` and `ReturnType<F>` only inspect the last overload; generic identity methods yield `unknown` through those utilities. In particular, an overload's `onSuccess` callback is not a sound per-overload view of every call. Use a suitable explicit contract or avoid relying on that callback for overloaded methods.
- This infers from the method, not from the symbol or aspect registration. Fixed-signature aspects still need an explicit shared contract, as in the `Uppercase` example.

## Type checking and limits

- `experimentalDecorators` is required. These are TypeScript **legacy decorators**, not the newer standard decorator API.
- Enabling `strict` is recommended for more thorough method type checks, but is not required to use the library.
- For a fixed-signature aspect, supply the shared function type explicitly. A generic aspect can use the original-method inference pattern above. It is not inferred from the metadata key, and a key does not verify the type of the registered aspect. Use the same type alias for the decorator, `LazyDecorator`, and `WrapParams`.
- The decorated method keeps its own public signature. For asynchronous methods, use a function type returning `Promise<Result>`. For overloads or generic methods, share the full overloaded or generic callable type; a wrapper must preserve that contract.
- An explicit `this` parameter in the shared type also checks the decorator target. A `this: void` contract does not require a receiver shape. Include the receiver contract when it matters; an omitted `this` does not check receiver requirements. The existing runtime binding behavior is unchanged.
- These are TypeScript structural compatibility checks, not exact type equality or runtime validation. Prefer a function-syntax alias such as `(value: string) => string`. Method-indexed types can retain TypeScript's bivariant parameter behavior, wider method parameters may be accepted (for example, a `string | number` method with a `string` contract), and `any` or type assertions can bypass checking. Ensure the shared type covers **all inputs the method publicly accepts**, so the aspect can handle every caller.
- The generic overload describes instance method contracts, not getters/setters or class fields. Keep using the original overload (without a type argument) for accessors. TypeScript cannot distinguish a function-valued accessor from a method in a legacy descriptor, and type arguments are erased at runtime, so this API cannot reject that misuse automatically. Existing accessor behavior is unchanged.
