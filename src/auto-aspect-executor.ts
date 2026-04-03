import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ASPECT } from './aspect';
import { AopMetadata } from './core/types';
import { LazyDecorator } from './lazy-decorator';

/**
 * If there are providers that have @Aspect declared and implement LazyDecorator,
 * iterate through all providers registered in the IoC container and apply LazyDecorator to each.
 */
@Injectable()
export class AutoAspectExecutor implements OnModuleInit {
  private readonly wrappedMethodCache = new WeakMap();
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.bootstrapLazyDecorators();
  }

  private bootstrapLazyDecorators() {
    const controllers = this.discoveryService.getControllers();
    const providers = this.discoveryService.getProviders();

    const lazyDecorators = this.lookupLazyDecorators(providers);
    if (lazyDecorators.length === 0) {
      return;
    }

    const instanceWrappers = providers
      .concat(controllers)
      .filter(({ instance }) => instance && Object.getPrototypeOf(instance));

    for (const lazyDecorator of lazyDecorators) {
      for (const wrapper of instanceWrappers) {
        this.applyLazyDecorator(lazyDecorator, wrapper);
      }
    }
  }

  private applyLazyDecorator(lazyDecorator: LazyDecorator, instanceWrapper: InstanceWrapper<any>) {
    const target = instanceWrapper.isDependencyTreeStatic()
      ? instanceWrapper.instance
      : instanceWrapper.metatype?.prototype;

    if (!target) {
      console.debug('[applyLazyDecorator] not found target');
      return;
    }

    // Use scanFromPrototype for support nestjs 8
    const prototypeToScan = instanceWrapper.isDependencyTreeStatic() ? Object.getPrototypeOf(target) : target;

    // Get all property keys including getters/setters from prototype chain
    const allPropertyKeys = this.getAllPropertyKeys(prototypeToScan);

    const metadataKey = this.reflector.get(ASPECT, lazyDecorator.constructor);
    // instance에 method names 를 순회하면서 lazyDecorator.wrap을 적용함
    for (const propertyKey of allPropertyKeys) {
      if (propertyKey === 'constructor') {
        continue;
      }

      // the target method is must be object or function
      // @see: https://github.com/rbuckton/reflect-metadata/blob/9562d6395cc3901eaafaf8a6ed8bc327111853d5/Reflect.ts#L938
      // Get descriptor to handle getters/setters properly (search in prototype chain)
      const descriptor = this.getPropertyDescriptor(prototypeToScan, propertyKey);
      const targetProperty = descriptor?.value || descriptor?.get || descriptor?.set;
      if (!targetProperty || (typeof targetProperty !== "object" && typeof targetProperty !== "function")) {
        continue;
      }

      const metadataList: AopMetadata[] = this.reflector.get<AopMetadata[]>(
        metadataKey,
        targetProperty,
      );
      if (!metadataList) {
        continue;
      }

      for (const aopMetadata of metadataList) {
        this.wrapMethod({ lazyDecorator, aopMetadata, methodName: propertyKey, target });
      }
    }
  }

  private wrapMethod({
    lazyDecorator,
    aopMetadata,
    methodName,
    target,
  }: {
    lazyDecorator: LazyDecorator;
    aopMetadata: AopMetadata;
    methodName: string;
    target: any;
  }) {
    const { originalFn, metadata, aopSymbol } = aopMetadata;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const wrappedFn = function (this: object, ...args: unknown[]) {
      const cache = self.wrappedMethodCache.get(this) || new WeakMap();
      const cached = cache.get(originalFn);
      if (cached) {
        return cached.apply(this, args);
      }

      const wrappedMethod = lazyDecorator.wrap({
        instance: this,
        methodName,
        method: originalFn.bind(this),
        metadata,
      });
      cache.set(originalFn, wrappedMethod);
      self.wrappedMethodCache.set(this, cache);
      return wrappedMethod.apply(this, args);
    };

    target[aopSymbol] ??= {};
    target[aopSymbol][methodName] = wrappedFn;
  }

  private getAllPropertyKeys(prototype: any): string[] {
    const keys = new Set<string>();
    let current = prototype;

    // Traverse prototype chain until reaching Object.prototype
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach((key) => keys.add(key));
      current = Object.getPrototypeOf(current);
    }

    return Array.from(keys);
  }

  private getPropertyDescriptor(prototype: any, propertyKey: string): PropertyDescriptor | undefined {
    let current = prototype;

    // Search in prototype chain
    while (current && current !== Object.prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(current, propertyKey);
      if (descriptor) {
        return descriptor;
      }
      current = Object.getPrototypeOf(current);
    }

    return undefined;
  }

  private lookupLazyDecorators(providers: InstanceWrapper[]): LazyDecorator[] {
    const { reflector } = this;

    return providers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance, metatype }) => {
        if (!instance || !metatype) {
          return false;
        }
        const aspect =
          reflector.get<string>(ASPECT, metatype) ||
          reflector.get<string>(ASPECT, Object.getPrototypeOf(instance).constructor);

        if (!aspect) {
          return false;
        }

        return typeof instance.wrap === 'function';
      })
      .map(({ instance }) => instance);
  }
}
