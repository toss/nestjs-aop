import { Injectable } from '@nestjs/common';
import { Bar } from './bar.decorator';

@Injectable()
export class BarService {
  @Bar({ options: '1' })
  thisTest() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    barThisValue = this;
  }
}
export let barThisValue: any;
