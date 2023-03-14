import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ASPECT } from './aspect';
import { LazyDecorator } from './lazy-decorator';

/**
 * Aspect 가 선언되어 있고 LazyDecorator 가 구현되어 있는 provider 가 있는 경우 ioc 에 등록된 모든 provider 를 순회하면서 LazyDecorator 를 적용함.
 */
@Injectable()
export class AutoAspectExecutor implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const providers = this.discoveryService.getProviders();

    const lazyDecorators = this.lookupLazyDecorators(providers);
    if (lazyDecorators.length === 0) {
      return;
    }

    providers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance }) => instance && Object.getPrototypeOf(instance))
      .forEach(({ instance }) => {
        this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          (methodName) =>
            lazyDecorators.forEach((lazyDecorator) => {
              const metadataKey = this.reflector.get(ASPECT, lazyDecorator.constructor);

              const metadataList: unknown[] = this.reflector.get(metadataKey, instance[methodName]);
              if (!metadataList) {
                return;
              }

              for (const metadata of metadataList) {
                const wrappedMethod = lazyDecorator.wrap({
                  instance,
                  methodName,
                  method: instance[methodName].bind(instance),
                  metadata,
                });
                Object.setPrototypeOf(wrappedMethod, instance[methodName]);
                instance[methodName] = wrappedMethod;
              }
            }),
        );
      });
  }

  private lookupLazyDecorators(providers: InstanceWrapper[]): LazyDecorator[] {
    const { reflector } = this;

    return providers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance, metatype }) => {
        if (!instance || !metatype) {
          return false;
        }

        const aspect = reflector.get<string>(ASPECT, metatype);
        if (!aspect) {
          return false;
        }

        return typeof instance.wrap === 'function';
      })
      .map(({ instance }) => instance);
  }
}
