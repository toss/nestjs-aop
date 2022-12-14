import { SetMetadata } from '@nestjs/common';
import { Aspect } from '../../../aspect';
import { LazyDecorator, WrapParams } from '../../../lazy-decorator';
import { SampleService } from '../sample';
import { FooService } from './foo.service';

export const FOO = Symbol('FOO');

type FooOptions = {
  options: string;
};
export const Foo = (options: FooOptions) => SetMetadata(FOO, options);

@Aspect(FOO)
export class FooDecorator implements LazyDecorator<FooService['foo'], FooOptions> {
  constructor(private readonly sampleService: SampleService) {}

  wrap({ method, metadata: options }: WrapParams<FooService['foo'], FooOptions>) {
    return (arg1: string, arg2: number) => {
      const originResult = method(arg1, arg2);
      const sample = this.sampleService.sample();

      return originResult + sample + JSON.stringify(options);
    };
  }
}
