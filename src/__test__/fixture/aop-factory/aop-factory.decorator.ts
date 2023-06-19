import { Aspect } from '../../../aspect';
import { createDecorator } from '../../../create-decorator';
import { LazyDecorator, WrapParams } from '../../../lazy-decorator';
import { SampleService } from '../sample';

export const AOP_FACTORY = Symbol('AOP_FACTORY');

type AopFactoryOptions = {
  options: string;
};
export const AopFactory = (options: AopFactoryOptions) => createDecorator(AOP_FACTORY, options);

@Aspect(AOP_FACTORY)
export class AopFactoryDecorator implements LazyDecorator<any, AopFactoryOptions> {
  constructor(private readonly sampleService: SampleService) {}

  wrap({ method, metadata: options }: WrapParams<any, AopFactoryOptions>) {
    return (...args: any[]) => {
      const originResult = method(...args);
      const sample = this.sampleService.sample();

      return originResult + ':' + sample + '_' + options.options;
    };
  }
}
