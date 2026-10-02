import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Module, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
const calls = [];
const KEY = Symbol('test');
class MyAspect {
  wrap({ method }) {
    return function (...args) {
      calls.push('before');
      const result = method(...args);
      calls.push('after');
      return result;
    };
  }
}
Aspect(KEY)(MyAspect);
class Service {
  run() {
    calls.push('original');
    return 42;
  }
  plain() {
    return 7;
  }
  onModuleInit() {
    calls.push('init');
  }
}
Injectable()(Service);
const desc = Object.getOwnPropertyDescriptor(Service.prototype, 'run');
createDecorator(KEY)(Service.prototype, 'run', desc);
Object.defineProperty(Service.prototype, 'run', desc);
class AppModule {}
Module({ imports: [AopModule], providers: [MyAspect, Service] })(AppModule);
async function smoke() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    assert.ok(calls.includes('init'));
    calls.length = 0;
    const s = app.get(Service);
    assert.equal(s.run(), 42);
    assert.deepEqual(calls, ['before', 'original', 'after']);
    assert.equal(s.plain(), 7);
    calls.length = 0;
    assert.equal(s.run(), 42);
    assert.deepEqual(calls, ['before', 'original', 'after']);
    console.log('PASS actual aspect, undecorated, lifecycle, repeated calls');
  } finally {
    await app.close();
  }
}
export { smoke };
