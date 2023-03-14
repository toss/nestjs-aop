import 'reflect-metadata';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { FooModule, FooService } from './fixture/foo';

describe('AopModule', () => {
  it('Lazy decoder overwrites the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.foo('original', 0)).toMatchInlineSnapshot(`"original0:dependency_options"`);
  });

  it('Prototype of the overwritten function must be the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);

    expect(Object.keys(fooService.foo)).toMatchInlineSnapshot(`Array []`);
    expect((fooService.foo as any)['original']).toBe(true);

    const proto = Object.getPrototypeOf(fooService.foo);
    expect(Object.keys(proto)).toMatchInlineSnapshot(`
    Array [
      "original",
    ]
    `);
    expect((proto as any)['original']).toBe(true);
  });

  it('Decorator order must be guaranteed', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.multipleDecorated('original', 0)).toMatchInlineSnapshot(
      `"original0:dependency_5:ts_decroator_4:dependency_3:ts_decroator_2:dependency_1"`,
    );
  });
});
