export type AnyFunction = (...args: unknown[]) => unknown;

export type AopMetadata = {
  originalFn: AnyFunction;
  metadata?: unknown;
  aopSymbol: symbol;
};
