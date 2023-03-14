import { Injectable } from '@nestjs/common';
import { Foo } from './foo.decorator';

@Injectable()
export class FooService {
  originalFoo: unknown;
  constructor() {
    this.originalFoo = this.foo;
  }

  @Foo({ options: 'options' })
  foo(arg1: string, arg2: number) {
    return arg1 + arg2;
  }

  @Foo({ options: 'options1' })
  @Foo({ options: 'options2' })
  @Foo({ options: 'options3' })
  multipleDecorated(arg1: string, arg2: number) {
    return arg1 + arg2;
  }
}
