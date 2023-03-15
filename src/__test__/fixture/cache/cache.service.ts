import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private readonly store = new Map();

  get(key: string): any | undefined {
    return this.store.get(key);
  }

  set(key: string, value: any): void {
    this.store.set(key, value);
  }
}
