import { Module } from '@nestjs/common';
import { SampleModule } from '../sample';
import { FooController } from './foo.controller';
import { FooDecorator } from './foo.decorator';

import { DuplicateService } from './duplicate.service';
import { FooService } from './foo.service';

@Module({
  imports: [SampleModule],
  controllers: [FooController],
  providers: [
    FooService,
    {
      provide: 'DUPLICATE_1',
      useValue: new DuplicateService(1),
    },
    {
      provide: 'DUPLICATE_2',
      useValue: new DuplicateService(2),
    },
    FooDecorator,
  ],
  exports: [FooService, 'DUPLICATE_1', 'DUPLICATE_2'],
})
export class FooModule {}
