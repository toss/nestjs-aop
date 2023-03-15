import { Aspect } from '../../../aspect';
import { createDecorator } from '../../../create-decorator';
import { LazyDecorator, WrapParams } from '../../../lazy-decorator';
import { SampleService } from '../sample';

export const BAR = Symbol('BAR');

type BarOptions = {
  options: string;
};
export const Bar = (options: BarOptions) => createDecorator(BAR, options);

@Aspect(BAR)
export class BarDecorator implements LazyDecorator<any, BarOptions> {
  constructor(private readonly sampleService: SampleService) {}

  wrap({ method, metadata: options }: WrapParams<any, BarOptions>) {
    return (...args: any[]) => {
      const originResult = method(...args);
      const sample = this.sampleService.sample();

      return originResult + ':' + sample + '_' + options.options;
    };
  }
}

export const NotAopBar = (options: BarOptions): MethodDecorator => {
  return (_: any, __: string | symbol, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value;
    descriptor.value = function (arg1: string, arg2: number) {
      return originMethod.call(this, arg1, arg2) + ':ts_decroator_' + options.options;
    };
    Object.setPrototypeOf(descriptor.value, originMethod);
  };
};

export const SetOriginalTrue = () => {
  return (_: any, __: string | symbol, descriptor: PropertyDescriptor) => {
    descriptor.value['original'] = true;
  };
};
