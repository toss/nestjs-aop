import 'reflect-metadata';
import { AopModule, Aspect, createDecorator } from '@toss/nestjs-aop';
import type { LazyDecorator, WrapParams } from '@toss/nestjs-aop';
import { Injectable, Module } from '@nestjs/common';
const KEY = Symbol('typed-consumer');
@Aspect(KEY)
class TestAspect implements LazyDecorator {
  wrap({ method }: WrapParams) {
    return method;
  }
}
@Injectable()
class Service {
  @createDecorator(KEY)
  run(): number {
    return 42;
  }
}
@Module({ imports: [AopModule], providers: [TestAspect, Service] })
export class ConsumerModule {}
