import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import supertest from 'supertest';
import { AopModule } from '../aop.module';
import { CacheModule } from './fixture/cache';
import { FooController, FooModule } from './fixture/foo';

describe('Controller', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AopModule, FooModule, CacheModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('With Cache applied, the actual method is called only once', async () => {
    const fooController = moduleRef.get(FooController);

    const requester = supertest(app.getHttpServer());
    await requester.get('/foo').query({ id: 1 }).expect(200).expect('foo1');
    await requester.get('/foo').query({ id: 1 }).expect(200).expect('foo1');
    await requester.get('/foo').query({ id: 2 }).expect(200).expect('foo2');
    await requester.get('/foo').query({ id: 2 }).expect(200).expect('foo2');
    await requester.get('/foo').query({ id: 2 }).expect(200).expect('foo2');
    await requester.get('/foo').query({ id: 3 }).expect(200).expect('foo3');

    expect(fooController.getFooCount).toMatchInlineSnapshot(`3`);
  });

  afterAll(async () => await app.close());
});
