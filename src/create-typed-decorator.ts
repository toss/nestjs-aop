import { createDecorator } from './create-decorator';

/** A legacy method decorator constrained to a shared aspect function type. */
export type TypedMethodDecorator<T extends (...args: any[]) => any> = (
  target: object & ThisParameterType<T>,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;

/**
 * Opt-in method signature checking. Use the same T with LazyDecorator<T>.
 * Requires legacy decorators (experimentalDecorators) and strict type checking.
 * Metadata keys do not infer or enforce the associated aspect's type.
 * Accessors are not supported; use createDecorator for getters and setters.
 */
export const createTypedDecorator = <T extends (...args: any[]) => any>(
  metadataKey: symbol | string,
  metadata?: unknown,
): TypedMethodDecorator<T> => {
  const decorator = createDecorator(metadataKey, metadata);

  return (target, propertyKey, descriptor) => {
    if (typeof descriptor.value !== 'function') {
      throw new TypeError('createTypedDecorator can only be applied to methods');
    }

    return decorator(target, propertyKey, descriptor);
  };
};
