import { Module } from '@nestjs/common';
import { SampleModule } from '../sample';

import { BarDecorator } from './bar.decorator';
import { BarService } from './bar.service';

@Module({
  imports: [SampleModule],
  providers: [BarService, BarDecorator],
  exports: [BarService],
})
export class BarModule {}
