import 'reflect-metadata';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { AopFactoryModule, AopFactoryService } from './fixture/aop-factory';
import { BarModule, BarService, barThisValue } from './fixture/bar';
import {
  DuplicateService,
  FooController,
  FooModule,
  FooService,
  fooThisValue,
} from './fixture/foo';
import { BazDecorator, BazModule, BazService, StaticBazService, bazThisValue } from './fixture/baz';
import { INestApplication } from '@nestjs/common';

describe('AopModule', () => {
  it('Lazy decorator overwrites the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule, BazModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService),
      bazService = await app.resolve(BazService);
    expect(fooService.foo('original', 0)).toMatchInlineSnapshot(`"original0:dependency_options"`);
    expect(bazService.baz('original', 0)).toMatchInlineSnapshot(`"original0:dependency_options"`);
  });

  it('Prototype of the overwritten function must be the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule, BazModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService),
      bazService = await app.resolve(BazService);

    // In the 'SetOriginalTrue' decorator, the original field in the originalFn was set to true.
    // Verify that the 'fooService.foo' object has no properties and its 'original' property is true
    expect(Object.keys(fooService.foo)).toMatchInlineSnapshot(`Array []`);
    expect((fooService.foo as any)['original']).toBe(true);

    // Verify that the 'bazService.baz' object has no properties and its 'original' property is true
    expect(Object.keys(bazService.baz)).toMatchInlineSnapshot(`Array []`);
    expect((bazService.baz as any)['original']).toBe(true);

    // Get the prototype of the 'fooService.foo' object and verify that it only has an 'original' property
    const proto = Object.getPrototypeOf(fooService.foo);
    expect(Object.keys(proto)).toMatchInlineSnapshot(`
          Array [
            "original",
          ]
        `);
    expect((proto as any)['original']).toBe(true);

    // Get the prototype of the 'bazService.baz' object and verify that it only has an 'original' property
    const proto2 = Object.getPrototypeOf(bazService.baz);
    expect(Object.keys(proto2)).toMatchInlineSnapshot(`
          Array [
            "original",
          ]
        `);
    expect((proto2 as any)['original']).toBe(true);
  });

  it('Decorator order must be guaranteed', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule, BazModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.multipleDecorated('original', 0)).toMatchInlineSnapshot(
      `"original0:dependency_7:dependency_6:ts_decroator_5:ts_decroator_4:dependency_3:ts_decroator_2:dependency_1:dependency_0"`,
    );
  });

  /**
   * There are codes that using `function.name`.
   * Therefore the codes below are necessary.
   *
   * ex) @nestjs/swagger
   */
  it('decorated function should have "name" property', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule, BazModule],
    }).compile();
    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    const fooController = app.get(FooController);

    expect(fooService.foo.name).toStrictEqual('foo');
    expect(fooService.getFoo.name).toStrictEqual('getFoo');
    expect(fooService.multipleDecorated.name).toStrictEqual('multipleDecorated');
    expect(fooService.thisTest.name).toStrictEqual('thisTest');
    expect(fooController.getFoo.name).toStrictEqual('getFoo');

    const bazService = await app.resolve(BazService);

    expect(bazService.baz.name).toStrictEqual('baz');
    expect(bazService.thisTest.name).toStrictEqual('thisTest');
  });

  describe('this of the decorated function must be this', () => {
    it('With AopModule', async () => {
      const module = await Test.createTestingModule({
        imports: [AopModule, FooModule, BazModule],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();
      const fooService = app.get(FooService),
        bazService = await app.resolve(BazService);

      fooService.thisTest();
      expect(fooThisValue).toBe(fooService);

      bazService.thisTest();
      expect(bazThisValue).toBe(bazService);
    });

    it('Without AopModule', async () => {
      const module = await Test.createTestingModule({
        imports: [BarModule, BazModule],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();
      const barService = app.get(BarService),
        bazService = await app.resolve(BazService);

      barService.thisTest();
      expect(barThisValue).toBe(barService);

      bazService.thisTest();
      expect(bazThisValue).toBe(bazService);
    });
  });

  it('Each instance should have its dependencies applied correctly', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule, BazModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const duplicateService1: DuplicateService = app.get('DUPLICATE_1');
    const duplicateService2: DuplicateService = app.get('DUPLICATE_2');
    const duplicateService3: DuplicateService = await app.resolve('DUPLICATE_3');
    const duplicateService4: DuplicateService = await app.resolve('DUPLICATE_4');

    expect(duplicateService1.getValue()).toMatchInlineSnapshot(`"1:dependency_value"`);
    expect(duplicateService2.getValue()).toMatchInlineSnapshot(`"2:dependency_value"`);
    expect(duplicateService3.getValue()).toMatchInlineSnapshot(`"3:dependency_value"`);
    expect(duplicateService4.getValue()).toMatchInlineSnapshot(`"4:dependency_value"`);
  });

  it('AopDecorator created using useFactory should also be functional', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, AopFactoryModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const aopFactoryService: AopFactoryService = app.get(AopFactoryService),
      aopFactoryRequestScopedService: AopFactoryService = await app.resolve(
        'AopFactoryRequestScopedService',
      );

    expect(aopFactoryService.getValue('params')).toMatchInlineSnapshot(`"params:dependency_1"`);
    expect(aopFactoryRequestScopedService.getValue('params')).toMatchInlineSnapshot(
      `"params:dependency_1"`,
    );
  });

  describe('wrap method of lazy decorator should be called only once per decorator if instance is static', () => {
    let bazService: StaticBazService, bazDecorator: BazDecorator;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [AopModule, BazModule],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();

      bazService = app.get(StaticBazService);
      bazDecorator = app.get(BazDecorator);
    });
    it('With once decorated', async () => {
      expect(bazService.bazOnce()).toMatchInlineSnapshot(`"once:dependency_0"`);
      expect(bazService.bazOnce()).toMatchInlineSnapshot(`"once:dependency_0"`);
      expect(bazDecorator.getWrapCalledCnt()).toMatchInlineSnapshot(`1`);
    });

    it('with twice decorated', async () => {
      expect(bazService.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazService.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazService.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazDecorator.getWrapCalledCnt()).toMatchInlineSnapshot(`2`);
    });
  });

  describe('wrap method of lazy decorator should be called per request and decorator if instance is request scoped', () => {
    let bazDecorator: BazDecorator, app: INestApplication;
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [AopModule, BazModule],
      }).compile();

      app = module.createNestApplication(new FastifyAdapter());
      await app.init();

      bazDecorator = app.get(BazDecorator);
    });
    it('With once decorated', async () => {
      const bazService: BazService = await app.resolve(BazService);
      expect(bazService.bazOnce()).toMatchInlineSnapshot(`"once:dependency_0"`);
      expect(bazService.bazOnce()).toMatchInlineSnapshot(`"once:dependency_0"`);
      expect(bazDecorator.getWrapCalledCnt()).toMatchInlineSnapshot(`1`);

      const bazService2: BazService = await app.resolve(BazService);
      expect(bazService2.bazOnce()).toMatchInlineSnapshot(`"once:dependency_0"`);
      expect(bazService2.bazOnce()).toMatchInlineSnapshot(`"once:dependency_0"`);
      expect(bazDecorator.getWrapCalledCnt()).toMatchInlineSnapshot(`2`);
    });

    it('with twice decorated', async () => {
      const bazService: BazService = await app.resolve(BazService);
      expect(bazService.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazService.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazService.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazDecorator.getWrapCalledCnt()).toMatchInlineSnapshot(`2`);

      const bazService2: BazService = await app.resolve(BazService);
      expect(bazService2.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazService2.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazService2.bazTwice()).toMatchInlineSnapshot(`"twice:dependency_1:dependency_0"`);
      expect(bazDecorator.getWrapCalledCnt()).toMatchInlineSnapshot(`4`);
    });
  });
});
