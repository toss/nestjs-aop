import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { AopTestingDecorator } from './aop-testing.decorator';

@Module({})
export class AopTestingModule {
  static registerAsync({
    imports,
    inject,
    useFactory,
  }: {
    imports?: ModuleMetadata['imports'];
    inject?: any[];
    useFactory: (...args: any[]) => any[];
  }): DynamicModule {
    return {
      module: AopTestingModule,
      imports,
      providers: [
        {
          provide: AopTestingDecorator,
          inject,
          useFactory: (...args: any[]) => {
            const dependencies = useFactory(...args);
            return new AopTestingDecorator(...dependencies);
          },
        },
      ],
    };
  }
}
