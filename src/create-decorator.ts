import { applyDecorators } from '@nestjs/common';
import { AddMetadata } from './utils';

/**
 * @param metadataKey equal to 1st argument of Aspect Decorator
 * @param metadata The value corresponding to the metadata of WrapParams. It can be obtained from LazyDecorator's warp method and used.
 */
export const createDecorator = (
  metadataKey: symbol | string,
  metadata?: unknown,
): MethodDecorator => {
  const aopSymbol = Symbol('AOP_DECORATOR');
  return applyDecorators(
    AddMetadata<symbol | string, { metadata?: unknown; aopSymbol: symbol }>(metadataKey, {
      metadata,
      aopSymbol,
    }),
    function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
      const originalFn = descriptor.value;
      descriptor.value = (...args: any[]) => {
        if (target[propertyKey][aopSymbol]) {
          // If there is a wrapper stored in the method, use it
          return target[propertyKey][aopSymbol](originalFn).apply(target, args);
        }
        // if there is no wrapper that comes out of method, call originalFn
        return originalFn.apply(target, args);
      };

      Object.setPrototypeOf(descriptor.value, originalFn);
    },
  );
};
