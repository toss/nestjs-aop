import { Aspect } from '../../aspect';
import { createDecorator } from '../../create-decorator';
import { LazyDecorator, WrapParams } from '../../lazy-decorator';

export const AUTO_CACHE = Symbol('AUTO_CACHE');

type AutoCacheOptions = {
  ttl?: number; // Time to live in milliseconds
};

export const AutoCache = (options?: AutoCacheOptions) => createDecorator(AUTO_CACHE, options);

@Aspect(AUTO_CACHE)
export class AutoCacheDecorator implements LazyDecorator<any, AutoCacheOptions> {
  private cache = new WeakMap<any, Map<string, { value: any; timestamp: number }>>();

  wrap({ instance, methodName, method, metadata }: WrapParams<any, AutoCacheOptions>) {
    return (...args: any[]) => {
      const instanceCache = this.cache.get(instance) || new Map();
      const cacheKey = `${methodName}_${JSON.stringify(args)}`;
      const cached = instanceCache.get(cacheKey);
      const ttl = metadata?.ttl || Infinity;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }

      const result = method(...args);
      instanceCache.set(cacheKey, { value: result, timestamp: Date.now() });
      this.cache.set(instance, instanceCache);

      return result;
    };
  }
}
