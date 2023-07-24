import { Controller, Get } from '@nestjs/common';
import { BazService } from './baz.service';
import { Baz } from './baz.decorator';

@Controller()
export class BazController {
  constructor(private readonly bazService: BazService) {}

  @Get('baz')
  @Baz({ options: '0' })
  getUrl() {
    return this.bazService.getUrl();
  }
}
