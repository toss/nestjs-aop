import { Module } from '@nestjs/common';
import { SampleModule } from '../sample';

import { SampleService } from '../sample/sample.service';
import { AopFactoryDecorator } from './aop-factory.decorator';
import { AopFactoryService } from './aop-factory.service';

@Module({
  imports: [SampleModule],
  providers: [
    AopFactoryService,
    {
      provide: AopFactoryDecorator,
      inject: [SampleService],
      useFactory: (sampleService: SampleService) => new AopFactoryDecorator(sampleService),
    },
  ],
  exports: [AopFactoryService],
})
export class AopFactoryModule {}
