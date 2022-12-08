import 'reflect-metadata';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../../aop.module';
import { FooModule, FooService } from './foo';

describe('AopModule', () => {
  it('Lazy decoder overwrites the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.foo('abc', 1)).toMatchInlineSnapshot(
      `"abc1sample{\\"options\\":\\"options\\"}"`,
    );
  });

  it('Prototype of the overwritten function must be the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(Object.getPrototypeOf(fooService.foo)).toBe(fooService.originalFoo);
  });
});
