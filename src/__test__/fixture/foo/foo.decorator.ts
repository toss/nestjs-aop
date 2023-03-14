import { Aspect } from '../../../aspect';
import { createDecorator } from '../../../create-decorator';
import { LazyDecorator, WrapParams } from '../../../lazy-decorator';
import { SampleService } from '../sample';
import { FooService } from './foo.service';

export const FOO = Symbol('FOO');

type FooOptions = {
  options: string;
};
export const Foo = createDecorator<FooOptions>(FOO);

@Aspect(FOO)
export class FooDecorator implements LazyDecorator<FooService['foo'], FooOptions> {
  constructor(private readonly sampleService: SampleService) {}

  wrap({ method, metadata: options }: WrapParams<FooService['foo'], FooOptions>) {
    return (arg1: string, arg2: number) => {
      const originResult = method(arg1, arg2);
      const sample = this.sampleService.sample();

      return originResult + ':' + sample + '_' + options.options;
    };
  }
}

export const NotAopFoo = (options: FooOptions): MethodDecorator => {
  return (_: any, __: string | symbol, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value;
    descriptor.value = function (arg1: string, arg2: number) {
      return originMethod.call(this, arg1, arg2) + ':ts_decroator_' + options.options;
    };
    Object.setPrototypeOf(descriptor.value, originMethod);
  };
};
