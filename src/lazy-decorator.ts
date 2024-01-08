/* eslint-disable @typescript-eslint/ban-types */
export type GenericParams<M = unknown> = {
  instance: any;
  methodName: string;
  metadata: M;
};

export type InitParams<T extends Function = Function, M = unknown> = 
  GenericParams<M> & {unboundMethod: T;}; 

/* The extending parameter's name must be 'boundMethod', but kept its name for backward-compatibility. */
export type WrapParams<T extends Function = Function, M = unknown> =
  GenericParams<M> & {method: T;};

/**
 * Aspect 선언시 구현이 필요합니다.
 *
 * @interface LazyDecorator
 * @member init is used for setting metadata or performing other initializations before the wrapped method has been called.
 * @member wrap is used for wrapping decorated method with advice logic.
 */
export interface LazyDecorator<T extends Function = Function, M = unknown> {
  init?(params: InitParams<T, M>): void;
  wrap(params: WrapParams<T, M>): T;
}
