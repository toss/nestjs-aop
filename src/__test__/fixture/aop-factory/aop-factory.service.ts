import { Injectable } from '@nestjs/common';
import { AopFactory } from './aop-factory.decorator';

@Injectable()
export class AopFactoryService {
  @AopFactory({ options: '1' })
  getValue(value: string) {
    return value;
  }
}
