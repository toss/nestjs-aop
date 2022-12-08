import { Module } from '@nestjs/common';

import { SampleService } from './sample.service';

@Module({
  providers: [SampleService],
  exports: [SampleService],
})
export class SampleModule {}
