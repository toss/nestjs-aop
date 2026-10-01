import 'reflect-metadata';

import { Injectable } from '@nestjs/common';
import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { ASPECT, Aspect } from '../aspect';
import { createDecorator } from '../create-decorator';
import { LazyDecorator, WrapParams } from '../lazy-decorator';

describe('Aspect', () => {
  it.each(['ASPECT_TEST', Symbol('ASPECT_TEST')])(
    'sets aspect and injectable metadata for %s',
    (metadataKey) => {
      @Aspect(metadataKey)
      class TestAspect {}

      expect(Reflect.getOwnMetadata(ASPECT, TestAspect)).toBe(metadataKey);
      expect(Reflect.getOwnMetadata(INJECTABLE_WATERMARK, TestAspect)).toBe(true);
    },
  );

  it('injects dependencies into an aspect and applies its wrapper', async () => {
    const metadataKey = Symbol('ASPECT_TEST');
    const Decorated = () => createDecorator(metadataKey);

    @Injectable()
    class Calls {
      readonly events: string[] = [];
    }

    @Aspect(metadataKey)
    class TestAspect implements LazyDecorator {
      constructor(readonly calls: Calls) {}

      wrap({ method }: WrapParams) {
        return (...args: unknown[]) => {
          this.calls.events.push('before');
          const result = method(...args);
          this.calls.events.push('after');
          return result;
        };
      }
    }

    @Injectable()
    class TestService {
      constructor(private readonly calls: Calls) {}

      @Decorated()
      echo(value: string) {
        this.calls.events.push(value);
        return value;
      }
    }

    const module = await Test.createTestingModule({
      imports: [AopModule],
      providers: [Calls, TestAspect, TestService],
    }).compile();

    try {
      await module.init();
      const calls = module.get(Calls);
      const service = module.get(TestService);

      expect(module.get(TestAspect).calls).toBe(calls);
      expect(service.echo('first')).toBe('first');
      expect(service.echo('second')).toBe('second');
      expect(calls.events).toEqual(['before', 'first', 'after', 'before', 'second', 'after']);
    } finally {
      await module.close();
    }
  });
});
