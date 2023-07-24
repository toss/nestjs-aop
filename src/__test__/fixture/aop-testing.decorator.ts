import { Aspect } from '../../aspect';
import { createDecorator } from '../../create-decorator';
import { LazyDecorator, WrapParams } from '../../lazy-decorator';

export const AOP_TESTING = Symbol('AOP_TESTING');

type AopTestingOptions = {
  callback?: (params: {
    args: any[];
    wrapParams: WrapParams<any, AopTestingOptions>;
    dependencies: any[][];
  }) => unknown;
  wrapCallback?: (
    params: WrapParams<any, AopTestingOptions>,
    self: AopTestingDecorator,
    // eslint-disable-next-line @typescript-eslint/ban-types
  ) => void;
};

export const AopTesting = (options: AopTestingOptions) => createDecorator(AOP_TESTING, options);

@Aspect(AOP_TESTING)
export class AopTestingDecorator implements LazyDecorator {
  private readonly dependencies: any[];

  constructor(...dependencies: any[]) {
    this.dependencies = dependencies;
  }

  wrap(params: WrapParams<any, AopTestingOptions>) {
    if (params.metadata.wrapCallback) {
      params.metadata.wrapCallback(params, this);
    }

    return (...args: any[]) => {
      if (params.metadata.callback) {
        return params.metadata.callback({
          args,
          wrapParams: params,
          dependencies: this.dependencies,
        });
      }

      return params.method(...args);
    };
  }
}
