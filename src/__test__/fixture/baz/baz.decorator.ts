import { LazyDecorator, WrapParams } from '../../../lazy-decorator';
import { Aspect } from '../../../aspect';
import { createDecorator } from '../../../create-decorator';
import { SampleService } from '../sample';

export const BAZ = Symbol('BAZ');

type BazOptions = {
  options: string;
};

export const Baz = (options: BazOptions) => createDecorator(BAZ, options);

@Aspect(BAZ)
export class BazDecorator implements LazyDecorator {
  constructor(private readonly sampleService: SampleService) {}
  wrap({ method, metadata: options }: WrapParams<any, BazOptions>) {
    return (...args: any[]) => {
      const originResult = method(...args);
      const sample = this.sampleService.sample();

      return originResult + ':' + sample + '_' + options.options;
    };
  }
}
