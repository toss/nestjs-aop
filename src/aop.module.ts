import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AutoAspectExecutor } from './auto-aspect-executor';

@Module({
  imports: [DiscoveryModule],
  providers: [AutoAspectExecutor],
})
export class AopModule {}
