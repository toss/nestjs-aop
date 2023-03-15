import { Injectable } from '@nestjs/common';
import { Foo, NotAopFoo, SetOriginalTrue } from './foo.decorator';

@Injectable()
export class FooService {
  @Foo({ options: 'options' })
  @SetOriginalTrue()
  foo(arg1: string, arg2: number) {
    return arg1 + arg2;
  }

  @Foo({ options: '0' })
  @Foo({ options: '1' })
  @NotAopFoo({ options: '2' })
  @Foo({ options: '3' })
  @NotAopFoo({ options: '4' })
  @NotAopFoo({ options: '5' })
  @Foo({ options: '6' })
  @Foo({ options: '7' })
  multipleDecorated(arg1: string, arg2: number) {
    return arg1 + arg2;
  }

  async getFoo(id) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return 'foo' + id;
  }
}
