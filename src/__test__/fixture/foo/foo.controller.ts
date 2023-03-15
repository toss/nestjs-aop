import { Controller, Get, Query } from '@nestjs/common';
import { Cache } from '../cache';
import { FooService } from './foo.service';

@Controller()
export class FooController {
  public getFooCount = 0;
  constructor(private readonly fooService: FooService) {}

  @Get('foo')
  @Cache()
  async getFoo(@Query('id') id: number) {
    this.getFooCount++;
    return await this.fooService.getFoo(id);
  }
}
