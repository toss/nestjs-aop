import { Module } from '@nestjs/common';
import { SampleModule } from '../sample';
import { FooDecorator } from './foo.decorator';

import { FooService } from './foo.service';

@Module({
  imports: [SampleModule],
  providers: [FooService, FooDecorator],
  exports: [FooService],
})
export class FooModule {}
