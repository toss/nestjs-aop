import { Module, Scope } from '@nestjs/common';
import { BazDecorator } from './baz.decorator';
import { BazService } from './baz.service';
import { BazController } from './baz.controller';
import { SampleModule } from '../sample';
import { DuplicateService } from './duplicate.service';

@Module({
  imports: [SampleModule],
  controllers: [BazController],
  providers: [
    BazDecorator,
    BazService,
    {
      provide: 'DUPLICATE_3',
      scope: Scope.REQUEST,
      useValue: new DuplicateService(3),
    },
    {
      provide: 'DUPLICATE_4',
      scope: Scope.REQUEST,
      useValue: new DuplicateService(4),
    },
  ],
})
export class BazModule {}
