import { Module } from '@nestjs/common';
import { SampleModule } from '../sample';
import { FooController } from './foo.controller';
import { FooDecorator } from './foo.decorator';

import { FooService } from './foo.service';

@Module({
  imports: [SampleModule],
  controllers: [FooController],
  providers: [FooService, FooDecorator],
  exports: [FooService],
})
export class FooModule {}
