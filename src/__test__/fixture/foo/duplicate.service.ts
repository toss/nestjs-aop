import { Injectable } from '@nestjs/common';
import { Foo } from './foo.decorator';

@Injectable()
export class DuplicateService {
  constructor(private readonly value: number) {}

  @Foo({ options: 'value' })
  getValue() {
    return this.value;
  }
}
