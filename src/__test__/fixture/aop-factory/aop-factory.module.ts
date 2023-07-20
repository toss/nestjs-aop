import { Module, Scope } from '@nestjs/common';
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
    {
      provide: 'AopFactoryRequestScopedService',
      scope: Scope.REQUEST,
      useClass: AopFactoryService,
    },
  ],
  exports: [AopFactoryService],
})
export class AopFactoryModule {}
