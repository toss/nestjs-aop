import { Injectable } from '@nestjs/common';
import { Foo, NotAopFoo, SetOriginalTrue } from './foo.decorator';

@Injectable()
export class FooService {
  @Foo({ options: 'options' })
  @SetOriginalTrue()
  foo(arg1: string, arg2: number) {
    return arg1 + arg2;
  }

  @Foo({ options: '1' })
  @NotAopFoo({ options: '2' })
  @Foo({ options: '3' })
  @NotAopFoo({ options: '4' })
  @Foo({ options: '5' })
  multipleDecorated(arg1: string, arg2: number) {
    return arg1 + arg2;
  }
}
