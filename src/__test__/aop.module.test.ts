import 'reflect-metadata';

import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { AopTesting, AopTestingDecorator } from './fixture/aop-testing.decorator';
import { AopTestingModule } from './fixture/aop-testing.module';

describe('AopModule', () => {
  it('Lazy decorator overwrites the original function', async () => {
    @Injectable()
    class FooService {
      @AopTesting({
        callback: () => {
          return 2;
        },
      })
      foo() {
        return 1;
      }
    }

    @Module({
      providers: [FooService],
      exports: [FooService],
    })
    class FooModule {}

    const module = await Test.createTestingModule({
      imports: [
        AopModule,
        FooModule,
        AopTestingModule.registerAsync({
          imports: [FooModule],
          inject: [FooService],
          useFactory: (fooService: FooService) => {
            return [fooService];
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.foo()).toMatchInlineSnapshot(`2`);
  });

  it('Prototype of the overwritten function must be the original function', async () => {
    // set original property to true
    const SetOriginalTrue = () => {
      return (_: any, __: string | symbol, descriptor: PropertyDescriptor) => {
        descriptor.value['original'] = true;
      };
    };

    @Injectable()
    class FooService {
      @AopTesting({
        callback: ({ wrapParams, args }) => {
          return wrapParams.method(...args);
        },
      })
      @SetOriginalTrue()
      foo() {
        return 1;
      }
    }

    @Module({
      providers: [FooService],
      exports: [FooService],
    })
    class FooModule {}

    const module = await Test.createTestingModule({
      imports: [
        AopModule,
        FooModule,
        AopTestingModule.registerAsync({
          imports: [FooModule],
          inject: [FooService],
          useFactory: (fooService: FooService) => {
            return [fooService];
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);

    // Verify that the 'fooService.foo' object has no properties and its 'original' property is true
    expect(Object.keys(fooService.foo)).toMatchInlineSnapshot(`Array []`);
    expect((fooService.foo as any)['original']).toBe(true);

    // Get the prototype of the 'fooService.foo' object and verify that it only has an 'original' property
    const proto = Object.getPrototypeOf(fooService.foo);
    expect(Object.keys(proto)).toMatchInlineSnapshot(`
          Array [
            "original",
          ]
        `);
    expect((proto as any)['original']).toBe(true);
  });

  it('Decorator order must be guaranteed', async () => {
    @Injectable()
    class FooService {
      @AopTesting({
        callback: ({ wrapParams, args }) => {
          return wrapParams.method(...args) + '2';
        },
      })
      @AopTesting({
        callback: ({ wrapParams, args }) => {
          return wrapParams.method(...args) + '1';
        },
      })
      multipleDecorated() {
        return '0';
      }
    }

    @Module({
      providers: [FooService],
      exports: [FooService],
    })
    class FooModule {}

    const module = await Test.createTestingModule({
      imports: [
        AopModule,
        FooModule,
        AopTestingModule.registerAsync({
          imports: [FooModule],
          inject: [FooService],
          useFactory: (fooService: FooService) => {
            return [fooService];
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.multipleDecorated()).toMatchInlineSnapshot(`"012"`);
  });

  /**
   * There are codes that using `function.name`.
   * Therefore the codes below are necessary.
   *
   * ex) @nestjs/swagger
   */
  it('decorated function should have "name" property', async () => {
    @Injectable()
    class FooService {
      @AopTesting({
        callback: ({ wrapParams, args }) => {
          return wrapParams.method(...args);
        },
      })
      foo() {
        return '0';
      }
    }

    @Controller()
    class FooController {
      @AopTesting({
        callback: ({ wrapParams, args }) => {
          return wrapParams.method(...args);
        },
      })
      @Get()
      getFoo() {
        return '0';
      }
    }

    @Module({
      controllers: [FooController],
      providers: [FooService],
      exports: [FooService],
    })
    class FooModule {}

    const module = await Test.createTestingModule({
      imports: [
        AopModule,
        FooModule,
        AopTestingModule.registerAsync({
          imports: [FooModule],
          inject: [FooService],
          useFactory: (fooService: FooService) => {
            return [fooService];
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    const fooController = app.get(FooController);

    expect(fooService.foo.name).toStrictEqual('foo');
    expect(fooController.getFoo.name).toStrictEqual('getFoo');
  });

  describe('this of the decorated function must be this', () => {
    it('With AopModule', async () => {
      let _this: unknown = undefined;
      @Injectable()
      class FooService {
        @AopTesting({
          callback: ({ wrapParams, args }) => {
            return wrapParams.method(...args);
          },
        })
        foo() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          _this = this;
          return '0';
        }
      }

      @Module({
        providers: [FooService],
        exports: [FooService],
      })
      class FooModule {}

      const module = await Test.createTestingModule({
        imports: [
          AopModule,
          FooModule,
          AopTestingModule.registerAsync({
            imports: [FooModule],
            inject: [FooService],
            useFactory: (fooService: FooService) => {
              return [fooService];
            },
          }),
        ],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();
      const fooService = app.get(FooService);

      fooService.foo();
      expect(_this).toBe(fooService);
    });

    it('Without AopModule', async () => {
      let _this: unknown = undefined;
      @Injectable()
      class FooService {
        @AopTesting({
          callback: ({ wrapParams, args }) => {
            return wrapParams.method(...args);
          },
        })
        foo() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          _this = this;
          return '0';
        }
      }

      @Module({
        providers: [FooService],
        exports: [FooService],
      })
      class FooModule {}

      const module = await Test.createTestingModule({
        imports: [
          // AopModule,
          FooModule,
          AopTestingModule.registerAsync({
            imports: [FooModule],
            inject: [FooService],
            useFactory: (fooService: FooService) => {
              return [fooService];
            },
          }),
        ],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();
      const fooService = app.get(FooService);

      fooService.foo();
      expect(_this).toBe(fooService);
    });
  });

  it('Each instance should have its dependencies applied correctly', async () => {
    @Injectable()
    class FooService {
      constructor(private readonly value: number) {}

      @AopTesting({
        callback: ({ wrapParams, args }) => {
          return wrapParams.method(...args);
        },
      })
      getValue() {
        return this.value;
      }
    }

    @Module({
      providers: [
        {
          provide: 'DUPLICATE_1',
          useValue: new FooService(1),
        },
        {
          provide: 'DUPLICATE_2',
          useValue: new FooService(2),
        },
        {
          provide: 'DUPLICATE_3',
          useValue: new FooService(3),
        },
      ],
      exports: ['DUPLICATE_1', 'DUPLICATE_2', 'DUPLICATE_3'],
    })
    class FooModule {}

    const module = await Test.createTestingModule({
      imports: [
        AopModule,
        FooModule,
        AopTestingModule.registerAsync({
          imports: [FooModule],
          inject: ['DUPLICATE_1'],
          useFactory: (fooService: FooService) => {
            return [fooService];
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const duplicateService1: FooService = app.get('DUPLICATE_1');
    const duplicateService2: FooService = app.get('DUPLICATE_2');
    const duplicateService3: FooService = await app.resolve('DUPLICATE_3');

    expect(duplicateService1.getValue()).toMatchInlineSnapshot(`1`);
    expect(duplicateService2.getValue()).toMatchInlineSnapshot(`2`);
    expect(duplicateService3.getValue()).toMatchInlineSnapshot(`3`);
  });

  it('AopDecorator created using useFactory should also be functional', async () => {
    @Injectable()
    class FooService {
      @AopTesting({
        callback: () => {
          return 2;
        },
      })
      foo() {
        return 1;
      }
    }

    @Module({
      providers: [FooService],
      exports: [FooService],
    })
    class FooModule {}

    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
      providers: [
        {
          provide: AopTestingDecorator,
          useFactory: () => {
            return new AopTestingDecorator();
          },
        },
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const fooService: FooService = app.get(FooService);

    expect(fooService.foo()).toMatchInlineSnapshot(`2`);
  });

  it('lazy decorator should be initialized only once per decorator if instance is static', async () => {
    @Injectable()
    class FooService {
      @AopTesting({
        callback: () => {
          return 2;
        },
      })
      foo() {
        return 1;
      }
    }

    @Module({
      providers: [FooService],
      exports: [FooService],
    })
    class FooModule {}

    let aopDecoratorInitialized = 0;
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
      providers: [
        {
          provide: AopTestingDecorator,
          useFactory: () => {
            aopDecoratorInitialized++;
            return new AopTestingDecorator();
          },
        },
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    const fooService: FooService = app.get(FooService);
    fooService.foo();
    fooService.foo();
    expect(aopDecoratorInitialized).toMatchInlineSnapshot(`1`);
  });
});
