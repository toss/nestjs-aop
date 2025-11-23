import 'reflect-metadata';

import { Injectable, Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { AutoCache, AutoCacheDecorator } from './fixture/auto-cache.decorator';

describe('Inheritance with AOP', () => {
  it('should work with inherited decorated method', async () => {
    let parentComputeCount = 0;

    @Injectable()
    class ParentService {
      @AutoCache()
      getData() {
        parentComputeCount++;
        return 'parent data';
      }
    }

    @Injectable()
    class ChildService extends ParentService {
      getChildData() {
        return 'child data';
      }
    }

    @Module({
      providers: [ChildService, AutoCacheDecorator],
      exports: [ChildService],
    })
    class TestModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, TestModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const childService = app.get(ChildService);

    // First call - should compute
    const result1 = childService.getData();
    expect(result1).toBe('parent data');
    expect(parentComputeCount).toBe(1);

    // Second call - should use cache
    const result2 = childService.getData();
    expect(result2).toBe('parent data');
    expect(parentComputeCount).toBe(1); // Should still be 1 (cached)
  });

  it('should work with inherited decorated getter', async () => {
    let parentComputeCount = 0;

    @Injectable()
    class ParentService {
      @AutoCache()
      get data() {
        parentComputeCount++;
        return 'parent data';
      }
    }

    @Injectable()
    class ChildService extends ParentService {
      get childData() {
        return 'child data';
      }
    }

    @Module({
      providers: [ChildService, AutoCacheDecorator],
      exports: [ChildService],
    })
    class TestModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, TestModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const childService = app.get(ChildService);

    // First call - should compute
    const result1 = childService.data;
    expect(result1).toBe('parent data');
    expect(parentComputeCount).toBe(1);

    // Second call - should use cache
    const result2 = childService.data;
    expect(result2).toBe('parent data');
    expect(parentComputeCount).toBe(1); // Should still be 1 (cached)
  });
});
