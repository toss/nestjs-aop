import { Module } from '@nestjs/common';
import { CacheDecorator } from './cache.decorator';

import { CacheService } from './cache.service';

@Module({
  providers: [CacheService, CacheDecorator],
})
export class CacheModule {}
