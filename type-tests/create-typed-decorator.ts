import { createDecorator, createTypedDecorator, LazyDecorator, WrapParams } from '../src';

const KEY = Symbol('typed');
type TextMethod = (value: string) => string;
const Text = () => createTypedDecorator<TextMethod>(KEY);

export class TextAspect implements LazyDecorator<TextMethod> {
  wrap({ method }: WrapParams<TextMethod>): TextMethod {
    // @ts-expect-error the shared aspect type also checks calls inside wrap
    method(123);
    return (value) => method(value).toUpperCase();
  }
}

export class BasicMethods {
  @Text()
  valid(value: string): string {
    return value;
  }

  // @ts-expect-error incompatible argument type
  @Text()
  wrongArgument(value: number): string {
    return String(value);
  }

  // @ts-expect-error incompatible return type
  @Text()
  wrongReturn(value: string): number {
    return value.length;
  }

  // @ts-expect-error asynchronous methods need an asynchronous shared type
  @Text()
  async wrongAsync(value: string): Promise<string> {
    return value;
  }

  // @ts-expect-error a property decorator has no method descriptor
  @Text()
  field = (value: string) => value;

  // @ts-expect-error non-callable accessors are not methods
  @Text()
  get getter(): string {
    return 'text';
  }

  @createDecorator(KEY)
  unchanged(value: number): number {
    return value;
  }
}

const result: string = new BasicMethods().valid('text');
// @ts-expect-error decorated methods retain their original public signatures
new BasicMethods().valid(123);
// @ts-expect-error decorating does not rewrite the return type
const wrongResult: number = result;
void wrongResult;

// @ts-expect-error the type argument must be callable
createTypedDecorator<string>(KEY);

type AsyncMethod = (value: string) => Promise<string>;
export class AsyncMethods {
  @createTypedDecorator<AsyncMethod>(KEY)
  async valid(value: string): Promise<string> {
    return value;
  }

  // @ts-expect-error synchronous return does not satisfy a Promise return
  @createTypedDecorator<AsyncMethod>(KEY)
  invalid(value: string): string {
    return value;
  }
}

type OptionalRestMethod = (prefix: string, count?: number, ...suffixes: string[]) => string;
export class OptionalRestMethods {
  @createTypedDecorator<OptionalRestMethod>(KEY)
  valid(prefix: string, count?: number, ...suffixes: string[]): string {
    return prefix + count + suffixes.join('');
  }

  // @ts-expect-error aspect may omit the optional argument
  @createTypedDecorator<OptionalRestMethod>(KEY)
  required(prefix: string, count: number): string {
    return prefix + count;
  }

  // @ts-expect-error rest argument types must agree
  @createTypedDecorator<OptionalRestMethod>(KEY)
  badRest(prefix: string, count?: number, ...suffixes: number[]): string {
    return prefix + count + suffixes.join('');
  }
}

type Receiver = { prefix: string };
type ReceiverMethod = (this: Receiver, value: string) => string;
export class WithReceiver {
  prefix = 'prefix';
  @createTypedDecorator<ReceiverMethod>(KEY)
  valid(this: Receiver, value: string): string {
    return this.prefix + value;
  }
}
export class MissingReceiver {
  // @ts-expect-error decorator target must satisfy the explicit receiver type
  @createTypedDecorator<ReceiverMethod>(KEY)
  invalid(value: string): string {
    return value;
  }
}
export class WrongReceiver {
  prefix = 'prefix';
  // @ts-expect-error incompatible explicit this parameter
  @createTypedDecorator<ReceiverMethod>(KEY)
  invalid(this: { prefix: number }, value: string): string {
    return this.prefix + value;
  }
}

type Overloaded = {
  (value: string): string;
  (value: number): number;
};
export class OverloadedMethods {
  valid(value: string): string;
  valid(value: number): number;
  @createTypedDecorator<Overloaded>(KEY)
  valid(value: string | number): string | number {
    return value;
  }

  // @ts-expect-error all overloads in the shared function type are required
  @createTypedDecorator<Overloaded>(KEY)
  invalid(value: string): string {
    return value;
  }
}
const overloadedString: string = new OverloadedMethods().valid('text');
const overloadedNumber: number = new OverloadedMethods().valid(1);
void [overloadedString, overloadedNumber];

type Identity = <T>(value: T) => T;
export class GenericMethods {
  @createTypedDecorator<Identity>(KEY)
  valid<T>(value: T): T {
    return value;
  }

  // @ts-expect-error a concrete method cannot implement generic identity
  @createTypedDecorator<Identity>(KEY)
  invalid(value: string): string {
    return value;
  }
}
const inferred: { id: number } = new GenericMethods().valid({ id: 1 });
void inferred;

export class VarianceChecks {
  // @ts-expect-error aspect may pass any string, not only a single literal
  @Text()
  narrowArgument(value: 'only'): string {
    return value;
  }

  // @ts-expect-error a string-returning aspect cannot preserve a literal return type
  @Text()
  narrowReturn(_value: string): 'only' {
    return 'only';
  }

  // Contextual inference alone does not connect a decorator to an aspect.
  @createTypedDecorator(KEY)
  missingType(value: string): string {
    return value;
  }
}

export class CollapsedSignatures {
  overloaded(value: string): string;
  overloaded(value: number): number;
  // @ts-expect-error the aspect must preserve all original overloads
  @Text()
  overloaded(value: string | number): string | number {
    return value;
  }

  // @ts-expect-error a string-only wrapper cannot preserve generic identity
  @Text()
  generic<T>(value: T): T {
    return value;
  }
}

// Documented TypeScript limitations, not a guarantee of runtime input validation.
// The shared contract should cover every input accepted by the public method.
export class StructuralCompatibilityLimits {
  @Text()
  broaderOriginal(value: string | number): string {
    return String(value);
  }

  @createTypedDecorator<{ method(value: string): string }['method']>(KEY)
  methodIndexedBivariance(value: 'only'): string {
    return value;
  }
}

type NoReceiverMethod = (this: void, value: string) => string;
export class NoReceiverMethods {
  @createTypedDecorator<NoReceiverMethod>(KEY)
  valid(this: void, value: string): string {
    return value;
  }
}
const noReceiverResult: string = new NoReceiverMethods().valid('text');
void noReceiverResult;
