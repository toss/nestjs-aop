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
    // 1. Add metadata to the method
    (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      return AddMetadata<
        symbol | string,
        { metadata?: unknown; aopSymbol: symbol; originalFn: unknown }
      >(metadataKey, {
        originalFn: descriptor.value,
        metadata,
        aopSymbol,
      })(target, propertyKey, descriptor);
    },
    // 2. Wrap the method before the lazy decorator is executed
    (_: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const originalFn = descriptor.value;

      descriptor.value = function (this: any, ...args: any[]) {
        if (this[aopSymbol]?.[propertyKey]) {
          // If there is a wrapper stored in the method, use it
          return this[aopSymbol][propertyKey].apply(this, args);
        }
        // if there is no wrapper that comes out of method, call originalFn
        return originalFn.apply(this, args);
      };

      /**
       * There are codes that using `function.name`.
       * Therefore the codes below are necessary.
       *
       * ex) @nestjs/swagger
       */
      Object.defineProperty(descriptor.value, 'name', {
        value: propertyKey.toString(),
        writable: false,
      });
      Object.setPrototypeOf(descriptor.value, originalFn);
    },
  );
};
