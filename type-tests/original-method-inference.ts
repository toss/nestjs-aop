import { createDecorator, LazyDecorator, TypedMethodDecorator, WrapParams } from '../src/index.js';

type AsyncMethod = (...args: any[]) => Promise<unknown>;
type RetryOptions<F extends AsyncMethod> = {
  retries: number;
  onSuccess?: (args: Parameters<F>, result: Awaited<ReturnType<F>>) => void;
};
const RETRY = Symbol('RETRY');
const Retry = <F extends AsyncMethod>(options: RetryOptions<F>) =>
  createDecorator<F>(RETRY, options);

type IsAny<T> = 0 extends 1 & T ? true : false;
declare function expectNotAny<T>(value: IsAny<T> extends true ? never : T): void;

export class InferredMethods {
  @Retry({
    retries: 3,
    onSuccess(args, result) {
      expectNotAny(args);
      expectNotAny(args[0]);
      expectNotAny(args[1]);
      expectNotAny(result);
      expectNotAny(result.name);
      const id: number = args[0];
      const locale: string | undefined = args[1];
      const name: string = result.name;
      // @ts-expect-error the original first parameter is number, not any
      const invalidId: string = args[0];
      // @ts-expect-error the original tuple has only two parameters
      void args[2];
      // @ts-expect-error the resolved original return type has no missing property
      void result.missing;
      void [id, locale, name, invalidId];
    },
  })
  async find(id: number, locale?: string): Promise<{ name: string }> {
    return { name: `${id}:${locale}` };
  }

  // @ts-expect-error Retry only accepts asynchronous methods
  @Retry({ retries: 3 })
  sync(id: number): string {
    return String(id);
  }
}

const result: Promise<{ name: string }> = new InferredMethods().find(1);
expectNotAny(result);
// @ts-expect-error original public argument types are preserved
new InferredMethods().find('wrong');
// @ts-expect-error original Promise result is not changed by decoration
const wrongResult: Promise<number> = new InferredMethods().find(1);
void wrongResult;

// A separately created decorator has no original-method context at this point.
const Precreated = Retry({
  retries: 3,
  onSuccess(args, value) {
    // @ts-expect-error without a target, the constraint supplies any arguments
    expectNotAny(args[0]);
    // @ts-expect-error the constraint supplies an unknown resolved result
    void value.name;
  },
});
export class PrecreatedExample {
  // @ts-expect-error a precreated broad contract cannot preserve this concrete return type
  @Precreated
  async find(id: number): Promise<{ name: string }> {
    return { name: String(id) };
  }
}

// Returning an unrestricted MethodDecorator also erases the inference link.
const Erased = <F extends AsyncMethod>(options: RetryOptions<F>): MethodDecorator =>
  createDecorator(RETRY, options);
export class ErasedExample {
  @Erased({
    retries: 3,
    onSuccess(args, value) {
      // @ts-expect-error erased return type cannot infer the original arguments
      expectNotAny(args[0]);
      // @ts-expect-error erased return type cannot infer the original result
      void value.name;
    },
  })
  async find(id: number): Promise<{ name: string }> {
    return { name: String(id) };
  }
}

export class OverloadedInference {
  find(value: string): Promise<string>;
  find(value: number): Promise<number>;
  @Retry({
    retries: 3,
    onSuccess(args, value) {
      expectNotAny(args[0]);
      expectNotAny(value);
      const numberArgument: number = args[0];
      const numberResult: number = value;
      // @ts-expect-error Parameters/ReturnType expose the last overload only
      const stringArgument: string = args[0];
      void [numberArgument, numberResult, stringArgument];
    },
  })
  async find(value: string | number): Promise<string | number> {
    return value;
  }
}
const overloadedString: Promise<string> = new OverloadedInference().find('text');
const overloadedNumber: Promise<number> = new OverloadedInference().find(1);
void [overloadedString, overloadedNumber];

export class GenericInference {
  @Retry({
    retries: 3,
    onSuccess(args, value) {
      expectNotAny(args[0]);
      expectNotAny(value);
      // @ts-expect-error utility types cannot specialize a generic identity to number
      const numberArgument: number = args[0];
      // @ts-expect-error generic identity's resolved ReturnType is unknown
      const numberResult: number = value;
      void [numberArgument, numberResult];
    },
  })
  async identity<T>(value: T): Promise<T> {
    return value;
  }
}
const genericResult: Promise<{ id: number }> = new GenericInference().identity({ id: 1 });
void genericResult;

// This declaration models a user-supplied signature-preserving retry helper.
// It does not claim that an arbitrary reconstructed async function implements F.
declare function retryify<F extends AsyncMethod>(original: F, options: RetryOptions<F>): F;
export class GenericRetryAspect implements LazyDecorator<AsyncMethod, RetryOptions<AsyncMethod>> {
  wrap<F extends AsyncMethod>({ method, metadata }: WrapParams<F, RetryOptions<F>>): F {
    return retryify(method, metadata);
  }
}

export function reconstructedWrapper<F extends AsyncMethod>(original: F): F {
  // @ts-expect-error a reconstructed function is not provably an arbitrary F
  return async (...args: Parameters<F>) => original(...args);
}

// Explicitly annotating the factory is fine as long as its return type retains F.
export const AnnotatedRetry = <F extends AsyncMethod>(
  options: RetryOptions<F>,
): TypedMethodDecorator<F> => createDecorator<F>(RETRY, options);

const ExplicitlyPrecreated = Retry<(id: number) => Promise<{ name: string }>>({
  retries: 3,
  onSuccess(args, value) {
    expectNotAny(args[0]);
    expectNotAny(value.name);
    const id: number = args[0];
    const name: string = value.name;
    void [id, name];
  },
});
export class ExplicitInferenceExamples {
  @ExplicitlyPrecreated
  async find(id: number): Promise<{ name: string }> {
    return { name: String(id) };
  }

  @AnnotatedRetry({
    retries: 3,
    onSuccess(args, value) {
      expectNotAny(args[0]);
      expectNotAny(value);
      const id: number = args[0];
      const result: string = value;
      // @ts-expect-error keeping TypedMethodDecorator<F> also preserves inference
      const wrongId: string = args[0];
      void [id, result, wrongId];
    },
  })
  async annotated(id: number): Promise<string> {
    return String(id);
  }
}
