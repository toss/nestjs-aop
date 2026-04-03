/* eslint-disable @typescript-eslint/ban-types */
export type WrapParams<T extends Function = Function, M = unknown> = {
  instance: any;
  methodName: string;
  method: T;
  metadata: M;
};

/**
 * Must be implemented when declaring an Aspect.
 * @see Aspect
 */
export interface LazyDecorator<T extends Function = Function, M = unknown> {
  wrap(params: WrapParams<T, M>): T;
}
