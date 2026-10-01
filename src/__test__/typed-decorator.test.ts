import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AopModule, Aspect, createTypedDecorator, LazyDecorator, WrapParams } from '../index';

const TEXT = Symbol('typed-text');
const ASYNC_TEXT = Symbol('typed-async-text');
type TextMethod = (value: string) => string;
type AsyncTextMethod = (value: string) => Promise<string>;
type Options = { suffix: string };

@Aspect(TEXT)
class TextAspect implements LazyDecorator<TextMethod, Options> {
  wrap({ method, metadata }: WrapParams<TextMethod, Options>): TextMethod {
    return (value) => method(value) + metadata.suffix;
  }
}

@Aspect(ASYNC_TEXT)
class AsyncTextAspect implements LazyDecorator<AsyncTextMethod> {
  wrap({ method }: WrapParams<AsyncTextMethod>): AsyncTextMethod {
    return async (value) => (await method(value)).toUpperCase();
  }
}

@Injectable()
class TextService {
  private readonly prefix = 'hello ';

  @createTypedDecorator<TextMethod>(TEXT, { suffix: '!' })
  text(value: string): string {
    return this.prefix + value;
  }

  @createTypedDecorator<AsyncTextMethod>(ASYNC_TEXT)
  async asyncText(value: string): Promise<string> {
    return this.prefix + value;
  }
}

describe('createTypedDecorator', () => {
  it('uses the existing aspect pipeline, forwards metadata, and preserves instance binding', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule],
      providers: [TextService, TextAspect, AsyncTextAspect],
    }).compile();
    try {
      await module.init();
      const service = module.get(TextService);
      expect(service.text('world')).toBe('hello world!');
      expect(service.text('again')).toBe('hello again!');
      await expect(service.asyncText('world')).resolves.toBe('HELLO WORLD');
    } finally {
      await module.close();
    }
  });

  it('calls the original method before AopModule initialization', () => {
    expect(new TextService().text('world')).toBe('hello world');
  });

  it('rejects callable accessors that cannot be distinguished from methods by TypeScript', () => {
    expect(() => {
      class CallableAccessor {
        @createTypedDecorator<TextMethod>(TEXT)
        get method(): TextMethod {
          return (value) => value;
        }
      }
      return CallableAccessor;
    }).toThrow('createTypedDecorator can only be applied to methods');
  });
});
