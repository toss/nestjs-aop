import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';

export const ASPECT = Symbol('ASPECT');

/**
 * Decorator to apply to providers that implements LazyDecorator.
 * @see LazyDecorator
 */
export function Aspect(metadataKey: string | symbol) {
  return applyDecorators(SetMetadata(ASPECT, metadataKey), Injectable);
}
