import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from '@jest/globals';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';

const KEY = Symbol('typescript-consumer');

@Injectable()
class Trace {
  readonly calls: string[] = [];
}

@Aspect(KEY)
class TestAspect implements LazyDecorator {
  constructor(private readonly trace: Trace) {}

  wrap({ method }: WrapParams) {
    return (...args: unknown[]) => {
      this.trace.calls.push('before');
      const result = method(...args);
      this.trace.calls.push('after');
      return result;
    };
  }
}

@Injectable()
class Service {
  constructor(private readonly trace: Trace) {}

  @createDecorator(KEY)
  run(value: number): number {
    this.trace.calls.push('original');
    return value * 2;
  }

  onModuleInit() {
    this.trace.calls.push('init');
  }
}

@Module({ imports: [AopModule], providers: [Trace, TestAspect, Service] })
class ConsumerModule {}

test('packed TypeScript consumer with the migration guide config', async () => {
  const app = await NestFactory.createApplicationContext(ConsumerModule, { logger: false });
  try {
    const trace = app.get(Trace);
    assert.ok(trace.calls.includes('init'));
    for (const value of [21, 7]) {
      trace.calls.length = 0;
      assert.equal(app.get(Service).run(value), value * 2);
      assert.deepEqual(trace.calls, ['before', 'original', 'after']);
    }
  } finally {
    await app.close();
  }
});
