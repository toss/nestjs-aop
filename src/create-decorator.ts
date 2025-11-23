import { applyDecorators } from '@nestjs/common';
import { AopMetadata } from './core/types';
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
    (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      return AddMetadata<symbol | string, AopMetadata>(metadataKey, {
        originalFn: descriptor.value || descriptor.get || descriptor.set,
        metadata,
        aopSymbol,
      })(target, propertyKey, descriptor);
    },
    // 2. Wrap the method before the lazy decorator is executed
    (_: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const originalFn = descriptor.value || descriptor.get || descriptor.set;

      const wrapperFn = function (this: any, ...args: unknown[]) {
        const wrappedFn = this[aopSymbol]?.[propertyKey];
        if (wrappedFn) {
          // If there is a wrapper stored in the method, use it
          return wrappedFn.apply(this, args);
        }
        // if there is no wrapper that comes out of method, call originalFn
        return originalFn.apply(this, args);
      };

      // Assign wrapper to the appropriate descriptor property
      if (descriptor.value !== undefined) {
        descriptor.value = wrapperFn;
      } else if (descriptor.get !== undefined) {
        descriptor.get = wrapperFn as any;
      } else if (descriptor.set !== undefined) {
        descriptor.set = wrapperFn as any;
      }

      /**
       * There are codes that using `function.name`.
       * Therefore the codes below are necessary.
       *
       * ex) @nestjs/swagger
       */
      Object.defineProperty(wrapperFn, 'name', {
        value: propertyKey.toString(),
        writable: false,
      });
      if (originalFn) {
        Object.setPrototypeOf(wrapperFn, originalFn);
      }
    },
  );
};
