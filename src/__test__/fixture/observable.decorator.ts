import { Aspect } from '../../aspect';
import { createDecorator } from '../../create-decorator';
import { LazyDecorator, WrapParams } from '../../lazy-decorator';

export const OBSERVABLE = Symbol('OBSERVABLE');

type ObservableOptions = {
  onChange?: (value: any, propertyName: string, instance: any) => void;
};

export const Observable = (options?: ObservableOptions) => createDecorator(OBSERVABLE, options);

@Aspect(OBSERVABLE)
export class ObservableDecorator implements LazyDecorator<any, ObservableOptions> {
  wrap({ instance, methodName, method, metadata }: WrapParams<any, ObservableOptions>) {
    return (...args: any[]) => {
      const result = method(...args);

      if (metadata?.onChange) {
        // For setters, the first argument is typically the value being set
        metadata.onChange(args[0], methodName, instance);
      }

      return result;
    };
  }
}
