import { AddMetadata } from './utils';

export function createDecorator<T = void>(metadataKey: any) {
  return (options: T) => AddMetadata(metadataKey, options);
}
