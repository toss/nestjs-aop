import { Aspect } from '../../../aspect';
import { createDecorator } from '../../../create-decorator';
import { LazyDecorator, WrapParams } from '../../../lazy-decorator';
import { CacheService } from './cache.service';

export const CACHE = Symbol('CACHE');

export const Cache = () => createDecorator(CACHE);

@Aspect(CACHE)
export class CacheDecorator implements LazyDecorator<any, void> {
  constructor(private readonly cacheService: CacheService) {}

  wrap({ method }: WrapParams<any, void>) {
    return (...args: any[]) => {
      const cacheKey = JSON.stringify(args);
      const cache = this.cacheService.get(cacheKey);
      if (cache) {
        return cache;
      }

      const result = method(...args);
      this.cacheService.set(cacheKey, result);
      return result;
    };
  }
}
