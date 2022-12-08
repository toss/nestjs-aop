import { Injectable } from '@nestjs/common';

@Injectable()
export class SampleService {
  sample() {
    return 'sample';
  }
}
