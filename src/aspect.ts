import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';

export const ASPECT = Symbol('ASPECT');

/**
 * AOP 를 사용하기 위한 데코레이터 입니다.
 * @see LazyDecorator 도 구현이 필요합니다.
 */
export function Aspect(metadataKey: string | symbol) {
  return applyDecorators(SetMetadata(ASPECT, metadataKey), Injectable);
}
