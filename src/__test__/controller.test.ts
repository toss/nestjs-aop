import { Controller, Get, INestApplication, Inject, Module, Query } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import supertest from 'supertest';
import { AopModule } from '../aop.module';
import { AopTesting } from './fixture/aop-testing.decorator';
import { AopTestingModule } from './fixture/aop-testing.module';

describe('Controller', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let called = 0;
  let wrapCalled = 0;

  beforeAll(async () => {
    const cache = new Map<string, any>();
    @Controller()
    class FooController {
      constructor(@Inject(REQUEST) private readonly request: any) {}

      @AopTesting({
        callback: ({ wrapParams, args }) => {
          const cacheKey = JSON.stringify(args);
          if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
          }
          const result = wrapParams.method(...args);
          cache.set(cacheKey, result);
          return result;
        },
      })
      @Get('/foo')
      foo(@Query('id') id: number) {
        called++;
        return id;
      }

      @AopTesting({
        wrapCallback: () => {
          wrapCalled++;
        },
      })
      @Get('/get-url')
      getUrl() {
        return this.request.url;
      }
    }

    @Module({
      controllers: [FooController],
    })
    class FooModule {}

    moduleRef = await Test.createTestingModule({
      imports: [
        AopModule,
        FooModule,
        AopTestingModule.registerAsync({
          useFactory: () => [],
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('With Cache applied, the actual method is called only once', async () => {
    const requester = supertest(app.getHttpServer());
    await requester.get('/foo').query({ id: 1 }).expect(200).expect('1');
    await requester.get('/foo').query({ id: 1 }).expect(200).expect('1');
    await requester.get('/foo').query({ id: 2 }).expect(200).expect('2');
    await requester.get('/foo').query({ id: 2 }).expect(200).expect('2');
    await requester.get('/foo').query({ id: 2 }).expect(200).expect('2');
    await requester.get('/foo').query({ id: 3 }).expect(200).expect('3');

    expect(called).toMatchInlineSnapshot(`3`);
  });

  it('With Baz Decorator applied, BazService method return request url included string properly', async () => {
    const requester = supertest(app.getHttpServer());
    await requester.get('/get-url?foo=1');
    await requester.get('/get-url?foo=2');
    await requester.get('/get-url?foo=3');
    const response = await requester.get('/get-url?foo=4');

    expect(response.text).toMatchInlineSnapshot(`"/get-url?foo=4"`);
    expect(wrapCalled).toMatchInlineSnapshot(`4`);
  });

  afterAll(async () => await app.close());
});
