import { applyDecorators } from '@nestjs/common';
import { AddMetadata } from './utils';

export function createDecorator<T = void>(metadataKey: any) {
  return (options: T): MethodDecorator => {
    const aopSymbol = Symbol('AOP_DECORATOR');
    return applyDecorators(
      AddMetadata<{ options: T; aopSymbol: symbol }>(metadataKey, { options, aopSymbol }),
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
}
