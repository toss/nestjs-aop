import 'reflect-metadata';

import { Injectable, Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { AutoCache, AutoCacheDecorator } from './fixture/auto-cache.decorator';
import { Observable, ObservableDecorator } from './fixture/observable.decorator';

describe('Getter and Setter with AOP', () => {
  it('AutoCache decorator should work on getter', async () => {
    let computeCount = 0;

    @Injectable()
    class UserService {
      private _name = 'John';

      @AutoCache({ ttl: 1000 })
      get name() {
        computeCount++;
        return this._name.toUpperCase();
      }
    }

    @Module({
      providers: [UserService, AutoCacheDecorator],
      exports: [UserService],
    })
    class UserModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, UserModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const userService = app.get(UserService);

    // First call - should compute
    const result1 = userService.name;
    expect(result1).toBe('JOHN');
    expect(computeCount).toBe(1);

    // Second call - should use cache
    const result2 = userService.name;
    expect(result2).toBe('JOHN');
    expect(computeCount).toBe(1); // Should still be 1 (cached)

    // Third call - should still use cache
    const result3 = userService.name;
    expect(result3).toBe('JOHN');
    expect(computeCount).toBe(1); // Should still be 1 (cached)
  });

  it('Observable decorator should work on setter method', async () => {
    const changes: Array<{ value: any; property: string }> = [];

    @Injectable()
    class UserService {
      private _name = 'John';
      private _age = 20;

      getName() {
        return this._name;
      }

      @Observable({
        onChange: (value, propertyName) => {
          changes.push({ value, property: propertyName });
        },
      })
      setName(value: string) {
        this._name = value;
      }

      getAge() {
        return this._age;
      }

      @Observable({
        onChange: (value, propertyName) => {
          changes.push({ value, property: propertyName });
        },
      })
      setAge(value: number) {
        this._age = value;
      }
    }

    @Module({
      providers: [UserService, ObservableDecorator],
      exports: [UserService],
    })
    class UserModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, UserModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const userService = app.get(UserService);

    // Initial values
    expect(userService.getName()).toBe('John');
    expect(userService.getAge()).toBe(20);
    expect(changes.length).toBe(0);

    // Set name - should trigger onChange
    userService.setName('Jane');
    expect(userService.getName()).toBe('Jane');
    expect(changes).toContainEqual({ value: 'Jane', property: 'setName' });

    // Set age - should trigger onChange
    userService.setAge(25);
    expect(userService.getAge()).toBe(25);
    expect(changes).toContainEqual({ value: 25, property: 'setAge' });

    // Verify all changes were recorded
    expect(changes.length).toBe(2);
  });

  it('AutoCache and Observable can work on separate properties', async () => {
    let getterCallCount = 0;
    const changes: any[] = [];

    @Injectable()
    class CounterService {
      private _count = 0;
      private _value = 0;

      @AutoCache()
      get count() {
        getterCallCount++;
        return this._count;
      }

      getValue() {
        return this._value;
      }

      @Observable({
        onChange: (value) => {
          changes.push(value);
        },
      })
      setValue(value: number) {
        this._value = value;
      }
    }

    @Module({
      providers: [CounterService, AutoCacheDecorator, ObservableDecorator],
      exports: [CounterService],
    })
    class CounterModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, CounterModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const counterService = app.get(CounterService);

    // Test AutoCache on getter
    const initial = counterService.count;
    expect(initial).toBe(0);
    expect(getterCallCount).toBe(1);

    // Getter call again - should use cache
    const cached = counterService.count;
    expect(cached).toBe(0);
    expect(getterCallCount).toBe(1);

    // Test Observable on setter method
    counterService.setValue(10);
    expect(changes).toContain(10);
    expect(counterService.getValue()).toBe(10);

    // Set another value
    counterService.setValue(20);
    expect(changes).toContain(20);
    expect(changes.length).toBe(2);
  });

  it('should throw error when decorator is applied to property with both getter and setter', () => {
    expect(() => {
      class TestService {
        private _value = '';

        @AutoCache()
        get value() {
          return this._value;
        }

        set value(val: string) {
          this._value = val;
        }
      }
      new TestService();
    }).toThrow(/both a getter and a setter/);
  });

  it('AutoCache with TTL should expire and recompute', async () => {
    let computeCount = 0;

    @Injectable()
    class TimestampService {
      @AutoCache({ ttl: 50 }) // 50ms TTL
      get timestamp() {
        computeCount++;
        return Date.now();
      }
    }

    @Module({
      providers: [TimestampService, AutoCacheDecorator],
      exports: [TimestampService],
    })
    class TimestampModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, TimestampModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const timestampService = app.get(TimestampService);

    // First call
    const timestamp1 = timestampService.timestamp;
    expect(computeCount).toBe(1);

    // Immediate second call - should use cache
    const timestamp2 = timestampService.timestamp;
    expect(timestamp2).toBe(timestamp1);
    expect(computeCount).toBe(1);

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Call after TTL - should recompute
    const timestamp3 = timestampService.timestamp;
    expect(computeCount).toBe(2);
    expect(timestamp3).toBeGreaterThan(timestamp1);
  });
});
