import { Injectable, Scope } from '@nestjs/common';
import { Baz } from './baz.decorator';

@Injectable({ scope: Scope.REQUEST })
export class DuplicateService {
  constructor(private readonly value: number) {}

  @Baz({ options: 'value' })
  getValue() {
    return this.value;
  }
}
